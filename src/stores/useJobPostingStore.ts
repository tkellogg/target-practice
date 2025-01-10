/*
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

import { create } from 'zustand'
import { JobPosting } from '../types/JobPosting'
import { Octokit } from '@octokit/rest'
import { generateAndSavePDF } from '../utils/pdf'

interface JobPostingStore {
  postings: JobPosting[]
  selectedPosting: JobPosting | null
  selectedRepo: string | null
  isLoading: boolean
  error: string | null
  loadPostings: () => Promise<void>
  createPosting: (company: string, title: string, url: string, rawText: string) => Promise<void>
  updatePosting: (posting: JobPosting) => Promise<void>
  setSelectedPosting: (posting: JobPosting | null) => void
  setSelectedRepo: (repo: string) => void
  analyzePosting: (posting: JobPosting) => Promise<void>
  generateResume: (posting: JobPosting) => Promise<void>
  updateRequirements: (posting: JobPosting, type: 'required' | 'optional', requirements: string[]) => Promise<void>
  updateSuccessCriteria: (posting: JobPosting, criteria: string[]) => Promise<void>
  exportToPDF: (posting: JobPosting) => Promise<string>
}

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
})

function formatId(company: string, title: string): string {
  const date = new Date().toISOString().split('T')[0]
  const slug = `${company}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${date}-${slug}`
}

// Helper to get file path for a posting
function getPostingPath(id: string): string {
  return `job-postings/${id}.xml`
}

async function callAnthropicAPI(prompt: string): Promise<any> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to call Anthropic API: ${error}`)
  }

  return response.json()
}

function createXmlDocument(posting: JobPosting): string {
  const doc = document.implementation.createDocument(null, 'jobPosting', null);
  
  function createElement(name: string, text?: string): Element {
    const element = doc.createElement(name);
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  const root = doc.documentElement;
  root.appendChild(createElement('company', posting.company));
  root.appendChild(createElement('title', posting.title));
  root.appendChild(createElement('url', posting.url));
  root.appendChild(createElement('rawText', posting.rawText));

  if (posting.analysis) {
    const analysis = createElement('analysis');
    analysis.appendChild(createElement('title', posting.analysis.title));
    analysis.appendChild(createElement('roleDescription', posting.analysis.roleDescription));
    analysis.appendChild(createElement('companyDescription', posting.analysis.companyDescription));

    const requiredSkills = createElement('requiredSkills');
    posting.analysis.requiredSkills.forEach((skill: string) => {
      requiredSkills.appendChild(createElement('skill', skill));
    });
    analysis.appendChild(requiredSkills);

    const optionalSkills = createElement('optionalSkills');
    posting.analysis.optionalSkills.forEach((skill: string) => {
      optionalSkills.appendChild(createElement('skill', skill));
    });
    analysis.appendChild(optionalSkills);

    const successCriteria = createElement('successCriteria');
    posting.analysis.successCriteria.forEach((criterion: string) => {
      successCriteria.appendChild(createElement('criterion', criterion));
    });
    analysis.appendChild(successCriteria);

    root.appendChild(analysis);
  }

  if (posting.generatedResume) {
    root.appendChild(createElement('generatedResume', posting.generatedResume));
  }

  const serializer = new XMLSerializer();
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(doc);
}

export const useJobPostingStore = create<JobPostingStore>((set, get) => ({
  postings: [],
  selectedPosting: null,
  selectedRepo: null,
  isLoading: false,
  error: null,

  setSelectedRepo: (repo) => set({ selectedRepo: repo }),

  loadPostings: async () => {
    const selectedRepo = get().selectedRepo
    if (!selectedRepo) return

    set({ isLoading: true, error: null })
    try {
      const [owner, repo] = selectedRepo.split('/')
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: 'job-postings'
      })

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response from GitHub')
      }

      // Only process XML files
      const xmlFiles = response.data.filter(file => 
        file.type === 'file' && file.name.endsWith('.xml')
      )

      const postings = await Promise.all(
        xmlFiles
          .map(async file => {
            try {
              const content = await octokit.repos.getContent({
                owner,
                repo,
                path: file.path
              })

              if (!('content' in content.data)) {
                return null
              }

              const xmlContent = atob(content.data.content)
              const parser = new DOMParser()
              const doc = parser.parseFromString(xmlContent, 'text/xml')

              const posting: JobPosting = {
                id: file.name.replace('.xml', ''),
                company: doc.querySelector('company')?.textContent || '',
                title: doc.querySelector('title')?.textContent || '',
                url: doc.querySelector('url')?.textContent || '',
                rawText: doc.querySelector('rawText')?.textContent || '',
                analysis: null,
                generatedResume: null
              }

              const analysis = doc.querySelector('analysis')
              if (analysis) {
                posting.analysis = {
                  title: analysis.querySelector('title')?.textContent || '',
                  roleDescription: analysis.querySelector('roleDescription')?.textContent || '',
                  companyDescription: analysis.querySelector('companyDescription')?.textContent || '',
                  requiredSkills: Array.from(analysis.querySelectorAll('requiredSkills > skill')).map(skill => skill.textContent || ''),
                  optionalSkills: Array.from(analysis.querySelectorAll('optionalSkills > skill')).map(skill => skill.textContent || ''),
                  successCriteria: Array.from(analysis.querySelectorAll('successCriteria > criterion')).map(criterion => criterion.textContent || '')
                }
              }

              const resume = doc.querySelector('generatedResume')
              if (resume) {
                posting.generatedResume = resume.textContent
              }

              return posting
            } catch (error) {
              console.error('Failed to parse posting:', error)
              return null
            }
          })
      )

      set({ 
        postings: postings.filter((p): p is JobPosting => p !== null),
        isLoading: false 
      })
    } catch (error) {
      console.error('Failed to load postings:', error)
      set({ error: 'Failed to load postings', isLoading: false })
    }
  },

  createPosting: async (company: string, title: string, url: string, rawText: string) => {
    const selectedRepo = get().selectedRepo
    if (!selectedRepo) return

    set({ isLoading: true, error: null })
    try {
      const id = formatId(company, title)
      const path = getPostingPath(id)
      const [owner, repo] = selectedRepo.split('/')

      const posting: JobPosting = {
        id,
        company,
        title,
        url,
        rawText,
        analysis: null,
        generatedResume: null
      }

      const xmlContent = createXmlDocument(posting)

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Add job posting for ${company} - ${title}`,
        content: btoa(xmlContent),
        branch: 'main'
      })

      const postings = [...get().postings, posting]
      set({ postings, selectedPosting: posting, isLoading: false })
    } catch (error) {
      console.error('Failed to create posting:', error)
      set({ error: 'Failed to create posting', isLoading: false })
    }
  },

  updatePosting: async (posting: JobPosting) => {
    const selectedRepo = get().selectedRepo
    if (!selectedRepo) return

    set({ isLoading: true, error: null })
    try {
      const path = getPostingPath(posting.id)
      const [owner, repo] = selectedRepo.split('/')

      // Get the current file to get its SHA
      const existingFile = await octokit.repos.getContent({
        owner,
        repo,
        path
      })

      if (!('sha' in existingFile.data)) {
        throw new Error('Invalid response from GitHub')
      }

      const xmlContent = createXmlDocument(posting)

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Update job posting for ${posting.company} - ${posting.title}`,
        content: btoa(xmlContent),
        sha: existingFile.data.sha,
        branch: 'main'
      })

      const postings = get().postings.map(p => 
        p.id === posting.id ? posting : p
      )
      set({ postings, selectedPosting: posting, isLoading: false })
    } catch (error) {
      console.error('Failed to update posting:', error)
      set({ error: 'Failed to update posting', isLoading: false })
    }
  },

  setSelectedPosting: (posting) => set({ selectedPosting: posting }),

  analyzePosting: async (posting: JobPosting) => {
    if (!posting.rawText) {
      set({ error: 'No job posting text to analyze' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const prompt = `Analyze this job posting and extract the following information in JSON format:
1. title: The exact job title
2. roleDescription: A concise description of the role and its responsibilities
3. companyDescription: A brief description of the company
4. requirements: Split into "required" and "optional" arrays of specific requirements
5. successCriteria: An array of what would make a candidate successful in this role (including implied criteria)

Job Posting:
${posting.rawText}`

      const response = await callAnthropicAPI(prompt)
      
      // Extract JSON by trimming everything before { and after }
      const text = response.content[0].text
      const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
      
      const analysis = JSON.parse(jsonText)
      
      const updatedPosting = { ...posting, analysis }
      await get().updatePosting(updatedPosting)
    } catch (error) {
      console.error('Failed to analyze job posting:', error)
      set({ error: 'Failed to analyze job posting', isLoading: false })
    }
  },

  generateResume: async (posting: JobPosting) => {
    if (!posting.analysis) {
      set({ error: 'No analysis available to generate resume' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const prompt = `Generate a tailored resume for this job posting. The resume should have:
1. An overview (2 sentences) summarizing character traits & experience relevant to the job
2. A closing paragraph (8-10 sentences) calling out specific experiences and correlating them to job requirements

Job Analysis:
${JSON.stringify(posting.analysis, null, 2)}

Format the response as JSON with "overview" and "closing" fields.`

      const response = await callAnthropicAPI(prompt)
      
      // Extract JSON by trimming everything before { and after }
      const text = response.content[0].text
      const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
      
      const generated = JSON.parse(jsonText)
      
      const updatedPosting = { 
        ...posting, 
        generatedResume: `${generated.overview}\n\n${generated.closing}`
      }
      await get().updatePosting(updatedPosting)
    } catch (error) {
      console.error('Failed to generate resume:', error)
      set({ error: 'Failed to generate resume', isLoading: false })
    }
  },

  updateRequirements: async (posting: JobPosting, type: 'required' | 'optional', requirements: string[]) => {
    if (!posting.analysis) return

    const updatedPosting = {
      ...posting,
      analysis: {
        ...posting.analysis,
        [type === 'required' ? 'requiredSkills' : 'optionalSkills']: requirements
      }
    }
    await get().updatePosting(updatedPosting)
  },

  updateSuccessCriteria: async (posting: JobPosting, criteria: string[]) => {
    if (!posting.analysis) return

    const updatedPosting = {
      ...posting,
      analysis: {
        ...posting.analysis,
        successCriteria: criteria
      }
    }
    await get().updatePosting(updatedPosting)
  },

  exportToPDF: async (posting: JobPosting) => {
    if (!posting.generatedResume) {
      throw new Error('No generated resume to export')
    }
    const selectedRepo = get().selectedRepo
    if (!selectedRepo) {
      throw new Error('No repository selected')
    }

    set({ isLoading: true, error: null })
    try {
      const path = await generateAndSavePDF(posting, selectedRepo)
      set({ isLoading: false })
      return path
    } catch (error) {
      console.error('Failed to export PDF:', error)
      set({ error: 'Failed to export PDF', isLoading: false })
      throw error
    }
  }
})) 