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
import { JobPosting, JobAnalysis } from '../types/JobPosting'
import type { AISuggestion, SectionSuggestions } from '../types/JobPostEditor'
import type { Resume } from '../types/Resume'
import { Octokit } from '@octokit/rest'
import { generateAndSavePDF } from '../utils/pdf'
import { callAnthropicAPI } from '../utils/api'
import {
  extractJobInfoPrompt,
  analyzeJobPostingPrompt,
  generateResumePrompt,
  generateSuggestionsPrompt,
  regenerateSectionPrompt
} from '../utils/prompts'
import { useResumeStore } from './useResumeStore'

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
  generateResume: (posting: JobPosting, resume: Resume) => Promise<void>
  updateRequirements: (posting: JobPosting, type: 'required' | 'optional', requirements: string[]) => Promise<void>
  updateSuccessCriteria: (posting: JobPosting, criteria: string[]) => Promise<void>
  exportToPDF: (posting: JobPosting) => Promise<string>
  generateSuggestions: (posting: JobPosting) => Promise<void>
  regenerateSection: (
    posting: JobPosting,
    section: 'overview' | 'summary' | 'experience' | 'openSource',
    sectionId: string | null,
    feedback: string,
    acceptedSuggestions: string[]
  ) => Promise<void>
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

  if (posting.suggestions) {
    const suggestions = createElement('suggestions');
    
    // Overview suggestions
    const overview = createElement('overview');
    posting.suggestions.overview.forEach(suggestion => {
      const elem = createElement('suggestion');
      elem.setAttribute('id', suggestion.id);
      elem.setAttribute('type', suggestion.type);
      elem.setAttribute('isAccepted', String(suggestion.isAccepted));
      elem.setAttribute('timestamp', suggestion.timestamp);
      elem.textContent = suggestion.text;
      overview.appendChild(elem);
    });
    suggestions.appendChild(overview);

    // Summary suggestions
    const summary = createElement('summary');
    posting.suggestions.summary.forEach(suggestion => {
      const elem = createElement('suggestion');
      elem.setAttribute('id', suggestion.id);
      elem.setAttribute('type', suggestion.type);
      elem.setAttribute('isAccepted', String(suggestion.isAccepted));
      elem.setAttribute('timestamp', suggestion.timestamp);
      elem.textContent = suggestion.text;
      summary.appendChild(elem);
    });
    suggestions.appendChild(summary);

    // Experience suggestions
    const experience = createElement('experience');
    Object.entries(posting.suggestions.experience).forEach(([jobId, jobSuggestions]) => {
      const job = createElement('job');
      job.setAttribute('id', jobId);
      jobSuggestions.forEach(suggestion => {
        const elem = createElement('suggestion');
        elem.setAttribute('id', suggestion.id);
        elem.setAttribute('type', suggestion.type);
        elem.setAttribute('isAccepted', String(suggestion.isAccepted));
        elem.setAttribute('timestamp', suggestion.timestamp);
        elem.textContent = suggestion.text;
        job.appendChild(elem);
      });
      experience.appendChild(job);
    });
    suggestions.appendChild(experience);

    // Open source suggestions
    const openSource = createElement('openSource');
    Object.entries(posting.suggestions.openSource).forEach(([projectId, projectSuggestions]) => {
      const project = createElement('project');
      project.setAttribute('id', projectId);
      projectSuggestions.forEach(suggestion => {
        const elem = createElement('suggestion');
        elem.setAttribute('id', suggestion.id);
        elem.setAttribute('type', suggestion.type);
        elem.setAttribute('isAccepted', String(suggestion.isAccepted));
        elem.setAttribute('timestamp', suggestion.timestamp);
        elem.textContent = suggestion.text;
        project.appendChild(elem);
      });
      openSource.appendChild(project);
    });
    suggestions.appendChild(openSource);

    root.appendChild(suggestions);
  }

  const serializer = new XMLSerializer();
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(doc);
}

async function listFiles(owner: string, repo: string, path: string): Promise<string[]> {
  const octokit = new Octokit({
    auth: import.meta.env.VITE_GH_ACCESS_KEY
  })

  const response = await octokit.repos.getContent({
    owner,
    repo,
    path
  })

  if (!Array.isArray(response.data)) {
    return []
  }

  return response.data
    .filter(file => file.type === 'file')
    .map(file => file.path)
}

async function getFileContent(owner: string, repo: string, path: string): Promise<string> {
  const octokit = new Octokit({
    auth: import.meta.env.VITE_GH_ACCESS_KEY
  })

  const response = await octokit.repos.getContent({
    owner,
    repo,
    path
  })

  if (!('content' in response.data)) {
    throw new Error('Invalid response from GitHub')
  }

  return atob(response.data.content)
}

async function saveToGithub(owner: string, repo: string, path: string, content: string): Promise<void> {
  const octokit = new Octokit({
    auth: import.meta.env.VITE_GH_ACCESS_KEY
  })

  try {
    // Try to get existing file to get its SHA
    const existing = await octokit.repos.getContent({
      owner,
      repo,
      path
    }).catch(() => null)

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: existing ? `Update ${path}` : `Create ${path}`,
      content: btoa(content),
      ...(existing?.data && 'sha' in existing.data ? { sha: existing.data.sha } : {}),
      branch: 'main'
    })
  } catch (error) {
    console.error('Failed to save to GitHub:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to save to GitHub')
  }
}

function parseSuggestions(element: Element): AISuggestion[] {
  return Array.from(element.querySelectorAll('suggestion')).map(suggestion => ({
    id: suggestion.getAttribute('id') || crypto.randomUUID(),
    text: suggestion.textContent || '',
    type: suggestion.getAttribute('type') as AISuggestion['type'],
    isAccepted: suggestion.getAttribute('isAccepted') === 'true',
    timestamp: suggestion.getAttribute('timestamp') || new Date().toISOString()
  }))
}

function parseSectionsFromText(rawText: string): string[] {
    // existing code...
    const sections: string[] = [];

    // Try to split on headings first
    const headingSplit = rawText.split(/(?:^|\n)(?:#{1,6}|[-*]\s)/g).map(part => part.trim());
    headingSplit.forEach(part => {
        if (part.toLowerCase().includes('experience')) {
            sections.push(part);
        } else {
            // existing logic to handle other sections...
            // ...
        }
    });

    // Fallback: If we still have no “experience” section, try scanning paragraphs for “experience” keywords
    if (!sections.find(s => s.toLowerCase().includes('experience'))) {
        const paragraphs = rawText.split(/\n\n+/);
        paragraphs.forEach(paragraph => {
            if (paragraph.toLowerCase().includes('experience') || paragraph.toLowerCase().includes('worked at')) {
                sections.push(paragraph.trim());
            }
        });
    }

    // ...
    return sections;
}

export const useJobPostingStore = create<JobPostingStore>((set, get) => ({
  postings: [],
  selectedPosting: null,
  selectedRepo: null,
  isLoading: false,
  error: null,

  setSelectedRepo: async (repo) => {
    set({ selectedRepo: repo })
    if (repo) {
      set({ isLoading: true, error: null })
      const [owner, repoName] = repo.split('/')
      try {
        const resumeContent = await getFileContent(owner, repoName, 'resume.xml')
        // Parse to validate XML
        const parser = new DOMParser()
        const doc = parser.parseFromString(resumeContent, 'application/xml')
        
        if (doc.querySelector('parsererror')) {
          throw new Error('Failed to parse resume XML')
        }
        
        set({ isLoading: false, error: null })
        return resumeContent
      } catch (error) {
        console.error('Failed to load resume:', error)
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load resume',
        })
        throw error
      }
    }
  },

  loadPostings: async () => {
    try {
      set({ isLoading: true, error: null })
      const { selectedRepo } = get()
      if (!selectedRepo) return

      const [owner, repo] = selectedRepo.split('/')
      const files = await listFiles(owner, repo, 'job-postings')
      
      const postings = await Promise.all(
        files
          .filter((f: string) => f.endsWith('.xml'))
          .map(async (file: string) => {
            const content = await getFileContent(owner, repo, file)
            const parser = new DOMParser()
            const doc = parser.parseFromString(content, 'application/xml')
            
            const analysis: JobAnalysis = {
              title: doc.querySelector('analysis title')?.textContent || '',
              roleDescription: doc.querySelector('analysis roleDescription')?.textContent || '',
              companyDescription: doc.querySelector('analysis companyDescription')?.textContent || '',
              requiredSkills: Array.from(doc.querySelectorAll('analysis requiredSkills skill'))
                .map(el => el.textContent || ''),
              optionalSkills: Array.from(doc.querySelectorAll('analysis optionalSkills skill'))
                .map(el => el.textContent || ''),
              successCriteria: Array.from(doc.querySelectorAll('analysis successCriteria criteria'))
                .map(el => el.textContent || '')
            }

            const posting: JobPosting = {
              id: file.replace('job-postings/', '').replace('.xml', ''),
              company: doc.querySelector('company')?.textContent || '',
              title: doc.querySelector('title')?.textContent || '',
              url: doc.querySelector('url')?.textContent || '',
              rawText: doc.querySelector('rawText')?.textContent || '',
              generatedResume: doc.querySelector('generatedResume')?.textContent || '',
              analysis
            }

            const suggestions = doc.querySelector('suggestions');
            if (suggestions) {
              posting.suggestions = {
                overview: parseSuggestions(suggestions.querySelector('overview') || document.createElement('div')),
                summary: parseSuggestions(suggestions.querySelector('summary') || document.createElement('div')),
                experience: Object.fromEntries(
                  Array.from(suggestions.querySelectorAll('experience job')).map(job => [
                    job.getAttribute('id') || '',
                    parseSuggestions(job)
                  ])
                ),
                openSource: Object.fromEntries(
                  Array.from(suggestions.querySelectorAll('openSource project')).map(project => [
                    project.getAttribute('id') || '',
                    parseSuggestions(project)
                  ])
                )
              };
            }

            return posting
          })
      )

      set({ postings, isLoading: false })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load postings' 
      })
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
      const prompt = analyzeJobPostingPrompt(posting.rawText)
      const response = await callAnthropicAPI(prompt)
      
      const text = typeof response.content === 'string' 
        ? response.content 
        : response.content[0]?.text || ''
      
      // Clean the text to ensure we only have JSON
      const jsonText = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1
      ).trim()

      if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        throw new Error('Invalid JSON response from API')
      }

      let analysis
      try {
        analysis = JSON.parse(jsonText)
        console.log('Parsed analysis:', analysis)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Failed to parse analysis JSON')
      }

      // Validate analysis structure
      if (!analysis.title || typeof analysis.title !== 'string' ||
          !analysis.roleDescription || typeof analysis.roleDescription !== 'string' ||
          !analysis.companyDescription || typeof analysis.companyDescription !== 'string' ||
          !Array.isArray(analysis.requiredSkills) ||
          !Array.isArray(analysis.optionalSkills) ||
          !Array.isArray(analysis.successCriteria)) {
        throw new Error('Invalid analysis structure')
      }

      // Ensure arrays contain only strings
      const validateStringArray = (arr: any[]): string[] => {
        return arr.map(item => String(item).trim()).filter(Boolean)
      }

      const validatedAnalysis = {
        ...analysis,
        requiredSkills: validateStringArray(analysis.requiredSkills),
        optionalSkills: validateStringArray(analysis.optionalSkills),
        successCriteria: validateStringArray(analysis.successCriteria)
      }
      
      const updatedPosting = { ...posting, analysis: validatedAnalysis }
      await get().updatePosting(updatedPosting)
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to analyze job posting:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze job posting' 
      })
      throw error
    }
  },

  generateResume: async (posting: JobPosting, resume: Resume): Promise<void> => {
    try {
      set({ isLoading: true, error: null })
      
      // Generate if it doesn't exist
      if (!posting.generatedResume) {
        const prompt = generateResumePrompt(posting, JSON.stringify(resume, null, 2))
        const response = await callAnthropicAPI(prompt)
        const generatedResume = typeof response.content === 'string'
          ? response.content
          : response.content[0]?.text || ''
        
        // Update posting with new resume
        const updatedPosting = {
          ...posting,
          generatedResume
        }

        await get().updatePosting(updatedPosting)
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to generate resume' 
      })
      throw error
    } finally {
      set({ isLoading: false })
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
  },

  generateSuggestions: async (posting: JobPosting): Promise<void> => {
    try {
      set({ isLoading: true, error: null })
      console.log('\nStarting suggestion generation for:', posting.id)

      if (!posting.generatedResume) {
        throw new Error('No generated resume to analyze')
      }

      // Get companies from the Resume object
      const { resume } = useResumeStore.getState()
      if (!resume) {
        throw new Error('Resume not loaded')
      }

      // Extract company names from experience items
      const companyNames = resume.experience.map(exp => exp.company)
      console.log('\nExtracted companies from Resume:', companyNames)

      // Extract project names from Resume
      const projectNames = resume.projects.map(proj => proj.name)
      console.log('\nExtracted project names from Resume:', projectNames)

      const { prompt, companyMap } = generateSuggestionsPrompt(posting, companyNames)
      const response = await callAnthropicAPI(prompt)
      
      // Extract JSON from response
      const text = typeof response.content === 'string' 
        ? response.content 
        : response.content[0]?.text || ''
      
      // Clean the text to ensure we only have JSON
      const jsonText = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1
      ).trim()

      console.log('\nExtracted JSON text:', jsonText)

      if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        throw new Error('Invalid JSON response from API')
      }

      let suggestions
      try {
        suggestions = JSON.parse(jsonText)
        console.log('\nParsed suggestions:', suggestions)
        console.log('Experience suggestion keys:', Object.keys(suggestions.experience))
        
        // Add validation logging
        console.log('\nValidating suggestions structure:', {
          hasOverview: Array.isArray(suggestions.overview),
          overviewCount: suggestions.overview?.length,
          hasSummary: Array.isArray(suggestions.summary),
          summaryCount: suggestions.summary?.length,
          hasExperience: typeof suggestions.experience === 'object',
          experienceCompanies: Object.keys(suggestions.experience || {}),
          hasOpenSource: typeof suggestions.openSource === 'object',
          openSourceProjects: Object.keys(suggestions.openSource || {})
        })
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Failed to parse suggestions JSON')
      }

      // Validate suggestion structure
      const validateSuggestions = (items: any[]): boolean => {
        return Array.isArray(items) && items.every(item => 
          typeof item === 'object' &&
          typeof item.text === 'string' &&
          ['truthfulness', 'coverage', 'detail', 'hiring_manager', 'company_fit'].includes(item.type)
        )
      }

      if (!suggestions.overview || !validateSuggestions(suggestions.overview) ||
          !suggestions.summary || !validateSuggestions(suggestions.summary) ||
          !suggestions.experience || typeof suggestions.experience !== 'object' ||
          !suggestions.openSource || typeof suggestions.openSource !== 'object') {
        throw new Error('Invalid suggestion structure')
      }

      // Add IDs and timestamps to suggestions
      const processSuggestions = (items: any[]): AISuggestion[] => 
        items.map(item => ({
          ...item,
          id: crypto.randomUUID(),
          isAccepted: true,
          timestamp: new Date().toISOString()
        }))

      // Normalize company names in experience suggestions
      const normalizedExperience = Object.fromEntries(
        Object.entries(suggestions.experience).map(([company, items]) => [
          company,
          processSuggestions(items as any[])
        ])
      )

      const processedSuggestions: SectionSuggestions = {
        overview: processSuggestions(suggestions.overview),
        summary: processSuggestions(suggestions.summary),
        experience: normalizedExperience,
        openSource: Object.fromEntries(
          Object.entries(suggestions.openSource)
            .map(([id, items]) => [id, processSuggestions(items as any[])])
        )
      }

      const updatedPosting = {
        ...posting,
        suggestions: processedSuggestions
      }

      await get().updatePosting(updatedPosting)
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error 
          ? `Failed to generate suggestions: ${error.message}`
          : 'Failed to generate suggestions' 
      })
      throw error
    }
  },

  regenerateSection: async (posting: JobPosting, section: 'overview' | 'summary' | 'experience' | 'openSource', sectionId: string | null, feedback: string, acceptedSuggestions: string[]) => {
    try {
      set({ isLoading: true, error: null })

      if (!posting.generatedResume) {
        throw new Error('No generated resume to update')
      }

      // Get the accepted suggestions
      const sectionSuggestions = posting.suggestions?.[section]
      if (!sectionSuggestions) {
        throw new Error('No suggestions found for section')
      }

      const suggestions = sectionId 
        ? (sectionSuggestions as Record<string, AISuggestion[]>)[sectionId]
        : sectionSuggestions as AISuggestion[]

      if (!suggestions) {
        throw new Error(`No suggestions found for ${sectionId || section}`)
      }

      const accepted = suggestions.filter(s => acceptedSuggestions.includes(s.id))

      const prompt = regenerateSectionPrompt(posting, accepted, feedback)
      const response = await callAnthropicAPI(prompt)
      const newContent = typeof response.content === 'string'
        ? response.content
        : response.content[0]?.text || ''

      if (!newContent.trim()) {
        throw new Error('Generated content is empty')
      }

      // Split existing resume into sections
      const sections = posting.generatedResume.split(/\n\s*\n/).filter(Boolean)
      
      let updatedResume: string
      if (section === 'overview' || section === 'summary') {
        const sectionIndex = section === 'overview' ? 0 : 1
        if (sectionIndex >= sections.length) {
          sections.push(newContent)
        } else {
          sections[sectionIndex] = newContent
        }
        updatedResume = sections.join('\n\n')
      } else {
        // For experience and projects, we need to find and replace the specific section
        if (!sectionId) {
          throw new Error('Section ID is required for experience and open source updates')
        }
        const sectionRegex = new RegExp(`(^|\\n\\n)${sectionId}[^]*?(?=\\n\\n|$)`)
        const match = posting.generatedResume.match(sectionRegex)
        if (!match) {
          // Section not found, append to appropriate section
          const sectionHeader = section === 'experience' ? 'Experience' : 'Open Source Projects'
          const sectionStart = posting.generatedResume.indexOf(sectionHeader)
          if (sectionStart === -1) {
            updatedResume = `${posting.generatedResume}\n\n${sectionHeader}\n${newContent}`
          } else {
            const beforeSection = posting.generatedResume.slice(0, sectionStart)
            const afterSection = posting.generatedResume.slice(sectionStart)
            updatedResume = `${beforeSection}${sectionHeader}\n${newContent}\n\n${afterSection}`
          }
        } else {
          updatedResume = posting.generatedResume.replace(sectionRegex, `$1${newContent}`)
        }
      }

      const updatedPosting = {
        ...posting,
        generatedResume: updatedResume
      }

      await get().updatePosting(updatedPosting)
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to regenerate section:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to regenerate section' 
      })
      throw error
    }
  }
})) 