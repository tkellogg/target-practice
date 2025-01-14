/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { create } from 'zustand';
import type { Resume } from '../types/Resume';
import type { JobPosting, JobAnalysis } from '../types/JobPosting';
import { getFileContent, saveFile, listFiles, parseRepoString } from '../utils/github';

interface JobPostingStore {
  selectedRepo: string | null;
  selectedPosting: JobPosting | null;
  postings: JobPosting[];
  isLoading: boolean;
  error: string | null;
  setSelectedRepo: (repo: string) => void;
  setSelectedPosting: (posting: JobPosting | null) => void;
  loadPostings: () => Promise<void>;
  createPosting: (posting: JobPosting) => Promise<void>;
  updatePosting: (posting: JobPosting) => Promise<void>;
  generateResume: (posting: JobPosting, resume: Resume) => Promise<void>;
  updateRequirements: (posting: JobPosting, type: 'required' | 'optional', requirements: string[]) => Promise<void>;
  analyzePosting: (posting: JobPosting) => Promise<void>;
}

function postingToXML(posting: JobPosting): string {
  const doc = document.implementation.createDocument(null, 'jobPosting', null);
  
  const addElement = (parent: Element, name: string, content: string) => {
    const elem = doc.createElement(name);
    elem.textContent = content;
    parent.appendChild(elem);
  };

  addElement(doc.documentElement, 'company', posting.company);
  addElement(doc.documentElement, 'title', posting.title);
  addElement(doc.documentElement, 'url', posting.url);
  addElement(doc.documentElement, 'rawText', posting.rawText);

  if (posting.generatedResume) {
    const resume = doc.createElement('generatedResume');
    addElement(resume, 'overview', posting.generatedResume.overview);
    addElement(resume, 'closing', posting.generatedResume.closing);
    
    const selectedIds = doc.createElement('selectedExperienceIds');
    posting.generatedResume.selectedExperienceIds.forEach((id: string) => {
      addElement(selectedIds, 'id', id);
    });
    resume.appendChild(selectedIds);
    
    doc.documentElement.appendChild(resume);
  }

  if (posting.analysis) {
    const analysis = doc.createElement('analysis');
    addElement(analysis, 'title', posting.analysis.title);
    addElement(analysis, 'roleDescription', posting.analysis.roleDescription);
    addElement(analysis, 'companyDescription', posting.analysis.companyDescription);

    const required = doc.createElement('requiredSkills');
    posting.analysis.requiredSkills.forEach(skill => addElement(required, 'skill', skill));
    analysis.appendChild(required);

    const optional = doc.createElement('optionalSkills');
    posting.analysis.optionalSkills.forEach(skill => addElement(optional, 'skill', skill));
    analysis.appendChild(optional);

    const criteria = doc.createElement('successCriteria');
    posting.analysis.successCriteria.forEach(item => addElement(criteria, 'criteria', item));
    analysis.appendChild(criteria);

    doc.documentElement.appendChild(analysis);
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

function parseXMLToPosting(xml: string, id: string): JobPosting | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  
  try {
    const posting: JobPosting = {
      id,
      company: doc.querySelector('company')?.textContent ?? '',
      title: doc.querySelector('title')?.textContent ?? '',
      url: doc.querySelector('url')?.textContent ?? '',
      rawText: doc.querySelector('rawText')?.textContent ?? ''
    };

    const generatedResumeElem = doc.querySelector('generatedResume');
    if (generatedResumeElem) {
      posting.generatedResume = {
        overview: generatedResumeElem.querySelector('overview')?.textContent ?? '',
        closing: generatedResumeElem.querySelector('closing')?.textContent ?? '',
        selectedExperienceIds: Array.from(generatedResumeElem.querySelectorAll('selectedExperienceIds id'))
          .map(el => el.textContent ?? '')
      };
    }

    const analysis = doc.querySelector('analysis');
    if (analysis) {
      posting.analysis = {
        title: analysis.querySelector('title')?.textContent ?? '',
        roleDescription: analysis.querySelector('roleDescription')?.textContent ?? '',
        companyDescription: analysis.querySelector('companyDescription')?.textContent ?? '',
        requiredSkills: Array.from(analysis.querySelectorAll('requiredSkills skill'))
          .map(el => el.textContent ?? ''),
        optionalSkills: Array.from(analysis.querySelectorAll('optionalSkills skill'))
          .map(el => el.textContent ?? ''),
        successCriteria: Array.from(analysis.querySelectorAll('successCriteria criteria'))
          .map(el => el.textContent ?? '')
      };
    }

    return posting;
  } catch (error) {
    console.error('Failed to parse job posting XML:', error);
    return null;
  }
}

export const useJobPostingStore = create<JobPostingStore>((set, get) => ({
  selectedRepo: null,
  selectedPosting: null,
  postings: [],
  isLoading: false,
  error: null,

  setSelectedRepo: (repo) => {
    set({ selectedRepo: repo });
    get().loadPostings();
  },

  setSelectedPosting: (posting) => {
    set({ selectedPosting: posting });
  },

  loadPostings: async () => {
    try {
      set({ isLoading: true, error: null });
      const { selectedRepo } = get();
      if (!selectedRepo) return;

      const { owner, repo } = parseRepoString(selectedRepo);
      const files = await listFiles(owner, repo, 'job-postings');
      
      const postings = await Promise.all(
        files
          .filter((f: string) => f.endsWith('.xml'))
          .map(async (file: string) => {
            const content = await getFileContent(owner, repo, file);
            const id = file.replace('job-postings/', '').replace('.xml', '');
            return parseXMLToPosting(content, id);
          })
      );

      set({ 
        postings: postings.filter((p): p is JobPosting => p !== null),
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading job postings:', error);
      set({ error: 'Failed to load job postings', isLoading: false });
    }
  },

  createPosting: async (posting: JobPosting) => {
    const { selectedRepo } = get();
    if (!selectedRepo) return;

    set({ isLoading: true, error: null });

    try {
      const { owner, repo } = parseRepoString(selectedRepo);
      const xml = postingToXML(posting);
      const path = `job-postings/${posting.id}.xml`;
      
      await saveFile(owner, repo, path, xml, `Create job posting for ${posting.company}`);
      set(state => ({ 
        postings: [...state.postings, posting],
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error creating job posting:', error);
      set({ error: 'Failed to create job posting', isLoading: false });
    }
  },

  updatePosting: async (posting: JobPosting) => {
    const { selectedRepo } = get();
    if (!selectedRepo) return;

    set({ isLoading: true, error: null });

    try {
      const { owner, repo } = parseRepoString(selectedRepo);
      const xml = postingToXML(posting);
      const path = `job-postings/${posting.id}.xml`;
      
      await saveFile(owner, repo, path, xml, `Update job posting for ${posting.company}`);
      set(state => ({
        postings: state.postings.map(p => p.id === posting.id ? posting : p),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating job posting:', error);
      set({ error: 'Failed to update job posting', isLoading: false });
    }
  },

  generateResume: async (posting: JobPosting, resume: Resume) => {
    try {
      set({ isLoading: true, error: null });
      
      // Generate overview
      const overviewResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a professional resume writer. Write a 2-sentence overview that summarizes character traits & experience directly relevant to this job.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Resume Overview:
${resume.personalInfo.description}

Please respond with a JSON object containing:
{
  "overview": "The 2-sentence overview"
}`
        })
      });

      if (!overviewResponse.ok) {
        throw new Error('Failed to generate overview');
      }

      const overviewData = await overviewResponse.json();
      const overviewJson = JSON.parse(
        overviewData.content[0].type === 'text' 
          ? overviewData.content[0].text.substring(
              overviewData.content[0].text.indexOf('{'),
              overviewData.content[0].text.lastIndexOf('}') + 1
            )
          : '{}'
      );

      // Create temporary IDs for experiences
      const experienceIds = resume.experience.map((_, i) => `exp_${i}`);

      // Get experience IDs to include
      const experienceResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a professional resume writer selecting which job experiences to include in a targeted resume.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Available Experiences:
${resume.experience.map((exp, i) => `
ID: ${experienceIds[i]}
Company: ${exp.company}
Description: ${exp.description}
Skills: ${exp.skills.join(', ')}
Accomplishments:
${exp.accomplishments.join('\n')}
`).join('\n')}

Please respond with a JSON object containing:
{
  "selectedIds": ["Array of experience IDs to include, in order of relevance"]
}`
        })
      });

      if (!experienceResponse.ok) {
        throw new Error('Failed to select experiences');
      }

      const experienceData = await experienceResponse.json();
      const experienceJson = JSON.parse(
        experienceData.content[0].type === 'text'
          ? experienceData.content[0].text.substring(
              experienceData.content[0].text.indexOf('{'),
              experienceData.content[0].text.lastIndexOf('}') + 1
            )
          : '{}'
      );

      // Create a map of ID to experience for easy lookup
      const experienceMap = new Map(
        resume.experience.map((exp, i) => [experienceIds[i], exp])
      );

      // Generate closing
      const closingResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a professional resume writer. Write an 8-10 sentence closing that calls out specific experiences at specific jobs and correlates them to job requirements.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Selected Experiences:
${experienceJson.selectedIds.map((id: string) => {
  const exp = experienceMap.get(id);
  if (!exp) return '';
  return `
Company: ${exp.company}
Description: ${exp.description}
Skills: ${exp.skills.join(', ')}
Accomplishments:
${exp.accomplishments.join('\n')}
`;
}).join('\n')}

Please respond with a JSON object containing:
{
  "closing": "The 8-10 sentence closing paragraph"
}`
        })
      });

      if (!closingResponse.ok) {
        throw new Error('Failed to generate closing');
      }

      const closingData = await closingResponse.json();
      const closingJson = JSON.parse(
        closingData.content[0].type === 'text'
          ? closingData.content[0].text.substring(
              closingData.content[0].text.indexOf('{'),
              closingData.content[0].text.lastIndexOf('}') + 1
            )
          : '{}'
      );

      // Update posting with new resume sections
      const updatedPosting = {
        ...posting,
        generatedResume: {
          overview: overviewJson.overview,
          selectedExperienceIds: experienceJson.selectedIds,
          closing: closingJson.closing
        }
      };

      await get().updatePosting(updatedPosting);
    } catch (error) {
      console.error('Error generating resume:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to generate resume' 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateRequirements: async (posting: JobPosting, type: 'required' | 'optional', requirements: string[]) => {
    if (!posting.analysis) return;

    const updatedPosting = {
      ...posting,
      analysis: {
        ...posting.analysis,
        [type === 'required' ? 'requiredSkills' : 'optionalSkills']: requirements
      }
    };
    await get().updatePosting(updatedPosting);
  },

  analyzePosting: async (posting: JobPosting) => {
    try {
      set({ isLoading: true, error: null });
      
      const prompt = `You are a professional resume writer analyzing a job posting. Please analyze this job posting and extract key information:

Job Posting:
${posting.rawText}

Please respond with a JSON object containing:
{
  "title": "The exact job title",
  "roleDescription": "A clear 2-3 sentence description of the role and its responsibilities",
  "companyDescription": "A brief description of the company and its context",
  "requiredSkills": ["Array of specific required skills, technologies, and qualifications"],
  "optionalSkills": ["Array of preferred or optional skills"],
  "successCriteria": ["Array of 3-5 key factors that would make a candidate successful in this role"]
}`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze posting: ${response.statusText}`);
      }

      const data = await response.json();
      const content = typeof data.content === 'string'
        ? data.content
        : data.content[0]?.type === 'text' 
          ? data.content[0].text 
          : '';

      // Extract JSON from the response
      const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      const analysis = JSON.parse(jsonStr) as JobAnalysis;

      // Update posting with analysis
      const updatedPosting = {
        ...posting,
        analysis
      };

      await get().updatePosting(updatedPosting);
    } catch (error) {
      console.error('Error analyzing job posting:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to analyze job posting',
        isLoading: false 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
})); 