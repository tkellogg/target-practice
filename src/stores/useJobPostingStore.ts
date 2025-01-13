/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { create } from 'zustand';
import type { Resume } from '../types/Resume';
import type { JobPosting } from '../types/JobPosting';
import { getFileContent, saveFile, listFiles, parseRepoString } from '../utils/github';
import { callAnthropicAPI } from '../utils/anthropic';
import { generateResumePrompt } from '../utils/prompts';

interface JobPostingStore {
  selectedRepo: string | null;
  postings: JobPosting[];
  isLoading: boolean;
  error: string | null;
  setSelectedRepo: (repo: string) => void;
  loadPostings: () => Promise<void>;
  createPosting: (posting: JobPosting) => Promise<void>;
  updatePosting: (posting: JobPosting) => Promise<void>;
  generateResume: (posting: JobPosting, resume: Resume) => Promise<void>;
  updateRequirements: (posting: JobPosting, type: 'required' | 'optional', requirements: string[]) => Promise<void>;
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
    addElement(doc.documentElement, 'generatedResume', posting.generatedResume);
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
      rawText: doc.querySelector('rawText')?.textContent ?? '',
      generatedResume: doc.querySelector('generatedResume')?.textContent ?? undefined
    };

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
  postings: [],
  isLoading: false,
  error: null,

  setSelectedRepo: (repo) => {
    set({ selectedRepo: repo });
    get().loadPostings();
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
      
      // Generate if it doesn't exist
      if (!posting.generatedResume) {
        const prompt = generateResumePrompt(posting, JSON.stringify(resume, null, 2));
        const response = await callAnthropicAPI(prompt);
        const generatedResume = typeof response.content === 'string'
          ? response.content
          : response.content[0]?.type === 'text' 
            ? response.content[0].text 
            : '';
        
        // Update posting with new resume
        const updatedPosting = {
          ...posting,
          generatedResume
        };

        await get().updatePosting(updatedPosting);
      }
    } catch (error) {
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
  }
})); 