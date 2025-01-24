/**
 * Copyright 2025 Tim Kellogg
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { create } from 'zustand';
import type { Resume, Experience } from '../types/Resume';
import type { JobPosting, JobAnalysis, GeneratedResume } from '../types/JobPosting';
import { getFileContent, saveFile, listFiles, parseRepoString } from '../utils/github';
import { analyzeJobPostingPrompt, generateResumeOverviewPrompt, selectExperiencesPrompt, generateResumeClosingPrompt } from '../utils/prompts';

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

  const addMapElement = (parent: Element, name: string, map: Record<string, string[]>) => {
    const elem = doc.createElement(name);
    Object.entries(map).forEach(([key, values]) => {
      const itemElem = doc.createElement('item');
      addElement(itemElem, 'id', key);
      const valuesElem = doc.createElement('values');
      values.forEach(value => addElement(valuesElem, 'value', value));
      itemElem.appendChild(valuesElem);
      elem.appendChild(itemElem);
    });
    parent.appendChild(elem);
  };

  const addExperienceMap = (parent: Element, experienceMap: Record<number, { 
    id: string,
    accomplishments: { id: string; text: string }[],
    skills: { id: string; text: string }[]
  }>) => {
    const elem = doc.createElement('experienceMap');
    Object.entries(experienceMap).forEach(([index, exp]) => {
      const expElem = doc.createElement('experience');
      addElement(expElem, 'index', index);
      addElement(expElem, 'id', exp.id);

      const accomplishmentsElem = doc.createElement('accomplishments');
      exp.accomplishments.forEach(acc => {
        const accElem = doc.createElement('accomplishment');
        addElement(accElem, 'id', acc.id);
        addElement(accElem, 'text', acc.text);
        accomplishmentsElem.appendChild(accElem);
      });
      expElem.appendChild(accomplishmentsElem);

      const skillsElem = doc.createElement('skills');
      exp.skills.forEach(skill => {
        const skillElem = doc.createElement('skill');
        addElement(skillElem, 'id', skill.id);
        addElement(skillElem, 'text', skill.text);
        skillsElem.appendChild(skillElem);
      });
      expElem.appendChild(skillsElem);

      elem.appendChild(expElem);
    });
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
    
    // Add selected accomplishments and skills
    addMapElement(resume, 'selectedExperienceAccomplishments', posting.generatedResume.selectedExperienceAccomplishments);
    addMapElement(resume, 'selectedExperienceSkills', posting.generatedResume.selectedExperienceSkills);
    addMapElement(resume, 'selectedProjectAccomplishments', posting.generatedResume.selectedProjectAccomplishments);
    addMapElement(resume, 'selectedProjectSkills', posting.generatedResume.selectedProjectSkills);
    
    // Add experience map
    addExperienceMap(resume, posting.generatedResume.experienceMap);
    
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

  return new XMLSerializer().serializeToString(doc);
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
      const parseMap = (parent: Element, selector: string): Record<string, string[]> => {
        const result: Record<string, string[]> = {};
        parent.querySelectorAll(selector).forEach(item => {
          const id = item.querySelector('id')?.textContent;
          const values = Array.from(item.querySelectorAll('values value'))
            .map(el => el.textContent ?? '');
          if (id) {
            result[id] = values;
          }
        });
        return result;
      };

      const parseExperienceMap = (parent: Element): Record<number, { 
        id: string,
        accomplishments: { id: string; text: string }[],
        skills: { id: string; text: string }[]
      }> => {
        const result: Record<number, any> = {};
        parent.querySelectorAll('experienceMap experience').forEach(exp => {
          const index = parseInt(exp.querySelector('index')?.textContent ?? '0');
          const id = exp.querySelector('id')?.textContent ?? '';

          const accomplishments = Array.from(exp.querySelectorAll('accomplishments accomplishment'))
            .map(acc => ({
              id: acc.querySelector('id')?.textContent ?? '',
              text: acc.querySelector('text')?.textContent ?? ''
            }));

          const skills = Array.from(exp.querySelectorAll('skills skill'))
            .map(skill => ({
              id: skill.querySelector('id')?.textContent ?? '',
              text: skill.querySelector('text')?.textContent ?? ''
            }));

          result[index] = { id, accomplishments, skills };
        });
        return result;
      };

      posting.generatedResume = {
        overview: generatedResumeElem.querySelector('overview')?.textContent ?? '',
        closing: generatedResumeElem.querySelector('closing')?.textContent ?? '',
        selectedExperienceAccomplishments: parseMap(generatedResumeElem, 'selectedExperienceAccomplishments item'),
        selectedExperienceSkills: parseMap(generatedResumeElem, 'selectedExperienceSkills item'),
        selectedProjectAccomplishments: parseMap(generatedResumeElem, 'selectedProjectAccomplishments item'),
        selectedProjectSkills: parseMap(generatedResumeElem, 'selectedProjectSkills item'),
        experienceMap: parseExperienceMap(generatedResumeElem)
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

type ExperienceMapItem = {
  expId: string;
  skills: Array<{ id: string; text: string; }>;
  accomplishments: Array<{ id: string; text: string; }>;
};

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
    console.log('setSelectedPosting called with:', posting?.id);
    set({ selectedPosting: posting });
  },

  loadPostings: async () => {
    try {
      const { selectedRepo, selectedPosting: currentSelectedPosting } = get();
      set({ isLoading: true, error: null });
      if (!selectedRepo) return;

      const { owner, repo } = parseRepoString(selectedRepo);
      const files = await listFiles(owner, repo, 'job-postings');
      
      const postings = await Promise.all(
        files
          .filter((f: string) => f.endsWith('.xml'))
          .map(async (file: string) => {
            const content = await getFileContent(owner, repo, file);
            const id = file.replace('job-postings/', '').replace('.xml', '');
            const posting = parseXMLToPosting(content, id);
            return posting;
          })
      );

      const filteredPostings = postings.filter((p): p is JobPosting => p !== null);
      
      // If we have a selected posting, find its updated version
      const updatedSelectedPosting = currentSelectedPosting 
        ? filteredPostings.find(p => p.id === currentSelectedPosting.id)
        : null;

      set({ 
        postings: filteredPostings,
        selectedPosting: updatedSelectedPosting || currentSelectedPosting,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading job postings:', error);
      set({ error: 'Failed to load job postings', isLoading: false });
    }
  },

  createPosting: async (posting) => {
    try {
      set({ isLoading: true, error: null });
      const { selectedRepo } = get();
      if (!selectedRepo) return;

      const { owner, repo } = parseRepoString(selectedRepo);
      const xml = postingToXML(posting);
      const fileSlug = `${posting.company}-${posting.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const path = `job-postings/${fileSlug}.xml`;

      await saveFile(owner, repo, path, xml);
      await get().loadPostings();
    } catch (error) {
      console.error('Error creating job posting:', error);
      set({ error: 'Failed to create job posting', isLoading: false });
    }
  },

  updatePosting: async (posting) => {
    try {
      set({ isLoading: true, error: null });
      const { selectedRepo } = get();
      if (!selectedRepo) return;

      const { owner, repo } = parseRepoString(selectedRepo);
      const xml = postingToXML(posting);
      const fileSlug = `${posting.company}-${posting.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const path = `job-postings/${fileSlug}.xml`;

      await saveFile(owner, repo, path, xml);
      await get().loadPostings();
    } catch (error) {
      console.error('Error updating job posting:', error);
      set({ error: 'Failed to update job posting', isLoading: false });
    }
  },

  generateResume: async (posting: JobPosting, resume: Resume) => {
    try {
      set({ isLoading: true, error: null });

      // First generate the experience map
      const prompt = selectExperiencesPrompt(posting, resume, []);
      const experienceMap = resume.experience.reduce((map, exp, i) => {
        const generateId = () => Math.random().toString(36).substring(2, 10);
        map[i] = {
          id: `exp_${i}`,
          skills: exp.skills.map(skill => ({ id: `skill_${generateId()}`, text: skill })),
          accomplishments: exp.accomplishments.map(acc => ({ id: `acc_${generateId()}`, text: acc }))
        };
        return map;
      }, {} as Record<number, { 
        id: string,
        accomplishments: { id: string; text: string }[],
        skills: { id: string; text: string }[]
      }>);

      // Debug log the mapping
      console.log('[DEBUG] Experience Map:');
      Object.entries(experienceMap).forEach(([i, exp]) => {
        console.log(`\nExperience ${i} (${exp.id}):`);
        console.log('Skills:');
        exp.skills.forEach(s => console.log(`  ${s.id} -> ${s.text}`));
        console.log('Accomplishments:');
        exp.accomplishments.forEach(a => console.log(`  ${a.id} -> ${a.text}`));
      });

      // Get selected accomplishments and skills from the API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'claude-3-5-sonnet-latest'
        })
      });

      const data = await response.json();
      const content = data.content[0].type === 'text'
        ? data.content[0].text
        : '';

      // Extract JSON from the response
      const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      const { selectedExperienceAccomplishments, selectedExperienceSkills } = JSON.parse(jsonStr);

      // Generate overview section
      const overviewResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generateResumeOverviewPrompt(posting, resume),
          model: 'claude-3-5-sonnet-latest'
        })
      });
      const overviewData = await overviewResponse.json();
      const overviewJson = JSON.parse(
        overviewData.content[0].type === 'text'
          ? overviewData.content[0].text.substring(
              overviewData.content[0].text.indexOf('{'),
              overviewData.content[0].text.lastIndexOf('}') + 1
            )
          : '{}'
      );

      // Generate closing section using all experiences
      const closingResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generateResumeClosingPrompt(posting, resume.experience),
          model: 'claude-3-5-sonnet-latest'
        })
      });
      const closingData = await closingResponse.json();
      const closingJson = JSON.parse(
        closingData.content[0].type === 'text'
          ? closingData.content[0].text.substring(
              closingData.content[0].text.indexOf('{'),
              closingData.content[0].text.lastIndexOf('}') + 1
            )
          : '{}'
      );

      // Create generated resume with filtered accomplishments and skills
      const generatedResume: GeneratedResume = {
        overview: overviewJson.overview,
        closing: closingJson.closing,
        selectedExperienceAccomplishments: selectedExperienceAccomplishments || {},
        selectedExperienceSkills: selectedExperienceSkills || {},
        selectedProjectAccomplishments: {}, // Not implemented yet
        selectedProjectSkills: {}, // Not implemented yet
        experienceMap
      };

      // Update posting with generated resume
      posting.generatedResume = generatedResume;
      await get().updatePosting(posting);
      await get().loadPostings();
    } catch (error) {
      console.error('Error generating resume:', error);
      set({ error: 'Failed to generate resume', isLoading: false });
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
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: analyzeJobPostingPrompt(posting) })
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