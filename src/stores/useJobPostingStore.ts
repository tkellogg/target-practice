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

function utf8ToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
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

    const requirements = createElement('requirements');
    const required = createElement('required');
    posting.analysis.requirements.required.forEach(req => {
      required.appendChild(createElement('item', req));
    });
    requirements.appendChild(required);

    const optional = createElement('optional');
    posting.analysis.requirements.optional.forEach(req => {
      optional.appendChild(createElement('item', req));
    });
    requirements.appendChild(optional);
    analysis.appendChild(requirements);

    const successCriteria = createElement('successCriteria');
    posting.analysis.successCriteria.forEach(criteria => {
      successCriteria.appendChild(createElement('item', criteria));
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

async function testCreateFile(selectedRepo: string) {
  const [owner, repo] = selectedRepo.split('/')
  try {
    console.log('Testing file creation...')
    
    // First ensure the job-postings directory exists
    try {
      await octokit.repos.getContent({
        owner,
        repo,
        path: 'job-postings'
      })
    } catch (error: any) {
      if (error.status === 404) {
        // Directory doesn't exist, create it with a .gitkeep file
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: 'job-postings/.gitkeep',
          message: 'Create job-postings directory',
          content: '',
          branch: 'main'
        })
      } else {
        throw error
      }
    }

    // Now test file creation in the root directory
    try {
      const existingFile = await octokit.repos.getContent({
        owner,
        repo,
        path: 'test.txt'
      })
      
      // If we get here, the file exists, so we need its SHA to update it
      if ('sha' in existingFile.data) {
        const result = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: 'test.txt',
          message: 'Test file update',
          content: utf8ToBase64('This is a test file'),
          sha: existingFile.data.sha,
          branch: 'main'
        })
        console.log('Test file updated successfully:', result)
        return true
      }
    } catch (error: any) {
      // 404 means file doesn't exist, which is fine
      if (error.status !== 404) {
        throw error
      }
    }

    // File doesn't exist, create it without SHA
    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'test.txt',
      message: 'Test file creation',
      content: utf8ToBase64('This is a test file'),
      branch: 'main'
    })
    console.log('Test file created successfully:', result)
    return true
  } catch (error: any) {
    console.error('Test file creation failed:', {
      status: error.status,
      message: error.message,
      response: error.response?.data
    })
    return false
  }
}

export const useJobPostingStore = create<JobPostingStore>((set, get) => ({
  postings: [],
  selectedPosting: null,
  selectedRepo: null,
  isLoading: false,
  error: null,

  setSelectedRepo: (repo) => set({ selectedRepo: repo }),

  loadPostings: async () => {
    const { selectedRepo } = get()
    if (!selectedRepo) {
      set({ error: 'No repository selected' })
      return
    }

    const [owner, repo] = selectedRepo.split('/')
    set({ isLoading: true, error: null })
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: 'job-postings'
      })

      if (Array.isArray(response.data)) {
        const postings = await Promise.all(
          response.data
            .filter(file => file.name.endsWith('.xml'))
            .map(async file => {
              const content = await octokit.repos.getContent({
                owner,
                repo,
                path: `job-postings/${file.name}`
              })
              
              if ('content' in content.data) {
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
                    requirements: {
                      required: Array.from(analysis.querySelectorAll('requirements > required > item')).map(item => item.textContent || ''),
                      optional: Array.from(analysis.querySelectorAll('requirements > optional > item')).map(item => item.textContent || '')
                    },
                    successCriteria: Array.from(analysis.querySelectorAll('successCriteria > item')).map(item => item.textContent || '')
                  }
                }

                const resume = doc.querySelector('generatedResume')
                if (resume) {
                  posting.generatedResume = resume.textContent
                }

                return posting
              }
              return null
            })
        )
        set({ postings: postings.filter((p): p is JobPosting => p !== null), isLoading: false })
      }
    } catch (error: any) {
      // If the directory doesn't exist yet, that's fine - just return empty list
      if (error.status === 404) {
        set({ postings: [], isLoading: false })
        return
      }
      
      console.error('Failed to load job postings:', error)
      set({ error: 'Failed to load job postings', isLoading: false })
    }
  },

  createPosting: async (company: string, title: string, url: string, rawText: string) => {
    const { selectedRepo } = get()
    if (!selectedRepo) {
      set({ error: 'No repository selected' })
      return
    }

    const [owner, repo] = selectedRepo.split('/')
    set({ isLoading: true, error: null })
    try {
      // First test if we can create a simple file
      const testSuccess = await testCreateFile(selectedRepo)
      if (!testSuccess) {
        throw new Error('Unable to create test file - please check GitHub permissions')
      }

      console.log('Creating posting with:', { company, title, url, rawTextLength: rawText.length })
      
      const id = formatId(company, title)
      console.log('Generated ID:', id)
      
      const posting: JobPosting = {
        id,
        company,
        title,
        url,
        rawText,
        analysis: null,
        generatedResume: null
      }

      const xml = createXmlDocument(posting)
      console.log('Generated XML length:', xml.length)
      console.log('XML:', xml)

      // Convert string to base64 with proper UTF-8 encoding
      const base64Content = utf8ToBase64(xml)
      console.log('Base64 content length:', base64Content.length)

      try {
        console.log('Creating file:', {
          path: `job-postings/${id}.xml`,
          contentLength: base64Content.length
        })
        
        const result = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: `job-postings/${id}.xml`,
          message: `Create job posting for ${company} - ${title}`,
          content: base64Content,
          branch: 'main'
        })
        
        console.log('GitHub API response:', result)
      } catch (error: any) {
        console.error('GitHub API error:', {
          status: error.status,
          message: error.message,
          response: error.response?.data
        })
        
        if (error.status === 404) {
          throw new Error(`Path not found: job-postings/${id}.xml - Does the job-postings directory exist?`)
        } else if (error.status === 403) {
          throw new Error('Permission denied. Please check your GitHub token has the correct permissions.')
        } else {
          throw new Error(`GitHub API error: ${error.message}`)
        }
      }

      set(state => ({ 
        postings: [...state.postings, posting],
        selectedPosting: posting,
        isLoading: false 
      }))
    } catch (error) {
      console.error('Failed to create job posting:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to create job posting', isLoading: false })
    }
  },

  updatePosting: async (posting: JobPosting) => {
    const { selectedRepo } = get()
    if (!selectedRepo) {
      set({ error: 'No repository selected' })
      return
    }

    const [owner, repo] = selectedRepo.split('/')
    set({ isLoading: true, error: null })
    try {
      const xml = createXmlDocument(posting)

      const currentFile = await octokit.repos.getContent({
        owner,
        repo,
        path: `job-postings/${posting.id}.xml`
      })

      if ('sha' in currentFile.data) {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: `job-postings/${posting.id}.xml`,
          message: `Update job posting for ${posting.company} - ${posting.title}`,
          content: utf8ToBase64(xml),
          sha: currentFile.data.sha
        })
      }

      set(state => ({
        postings: state.postings.map(p => p.id === posting.id ? posting : p),
        selectedPosting: posting,
        isLoading: false
      }))
    } catch (error) {
      console.error('Failed to update job posting:', error)
      set({ error: 'Failed to update job posting', isLoading: false })
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
        requirements: {
          ...posting.analysis.requirements,
          [type]: requirements
        }
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