import { create } from 'zustand'
import { Resume } from '../types/Resume'
import { Octokit } from '@octokit/rest'

interface ResumeStore {
  resume: Resume | null
  selectedRepo: string | null
  isLoading: boolean
  error: string | null
  setSelectedRepo: (repo: string) => void
  loadResume: () => Promise<void>
  updateResume: (resume: Resume) => Promise<void>
}

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
})

function parseXMLToResume(xml: string): Resume | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  
  try {
    const personalInfo = {
      name: doc.querySelector('personalInfo > name')?.textContent || '',
      address: doc.querySelector('personalInfo > address')?.textContent || '',
      phone: doc.querySelector('personalInfo > phone')?.textContent || '',
      email: doc.querySelector('personalInfo > email')?.textContent || '',
      description: doc.querySelector('personalInfo > description')?.textContent || ''
    }

    const experience = Array.from(doc.querySelectorAll('experience > job')).map(job => ({
      company: job.querySelector('company')?.textContent || '',
      dates: job.querySelector('dates')?.textContent || '',
      positions: Array.from(job.querySelectorAll('positions > position')).map(p => ({
        title: p.textContent || '',
        startDate: p.getAttribute('startDate') || '',
        endDate: p.getAttribute('endDate') || ''
      })),
      skills: Array.from(job.querySelectorAll('skills > skill')).map(s => s.textContent || ''),
      description: job.querySelector('description')?.textContent || '',
      accomplishments: Array.from(job.querySelectorAll('accomplishments > item')).map(a => a.textContent || '')
    }))

    const projects = Array.from(doc.querySelectorAll('projects > project')).map(project => ({
      name: project.querySelector('name')?.textContent || '',
      url: project.querySelector('url')?.textContent || '',
      description: project.querySelector('description')?.textContent || '',
      technologies: Array.from(project.querySelectorAll('technologies > technology')).map(t => t.textContent || '')
    }))

    const patents = Array.from(doc.querySelectorAll('patents > patent')).map(patent => ({
      number: patent.querySelector('number')?.textContent || '',
      title: patent.querySelector('title')?.textContent || ''
    }))

    return { personalInfo, experience, projects, patents }
  } catch (error) {
    console.error('Failed to parse resume XML:', error)
    return null
  }
}

function resumeToXML(resume: Resume): string {
  const doc = document.implementation.createDocument(null, 'resume', null)
  
  // Personal Info
  const personalInfo = doc.createElement('personalInfo')
  const addElement = (parent: Element, name: string, content: string) => {
    const elem = doc.createElement(name)
    elem.textContent = content
    parent.appendChild(elem)
  }

  addElement(personalInfo, 'name', resume.personalInfo.name)
  addElement(personalInfo, 'address', resume.personalInfo.address)
  addElement(personalInfo, 'phone', resume.personalInfo.phone)
  addElement(personalInfo, 'email', resume.personalInfo.email)
  addElement(personalInfo, 'description', resume.personalInfo.description)
  doc.documentElement.appendChild(personalInfo)

  // Experience
  const experience = doc.createElement('experience')
  resume.experience.forEach(job => {
    const jobElem = doc.createElement('job')
    addElement(jobElem, 'company', job.company)
    addElement(jobElem, 'dates', job.dates)
    addElement(jobElem, 'description', job.description)

    const positions = doc.createElement('positions')
    job.positions.forEach(pos => {
      const posElem = doc.createElement('position')
      posElem.textContent = pos.title
      posElem.setAttribute('startDate', pos.startDate)
      posElem.setAttribute('endDate', pos.endDate)
      positions.appendChild(posElem)
    })
    jobElem.appendChild(positions)

    const skills = doc.createElement('skills')
    job.skills.forEach(skill => addElement(skills, 'skill', skill))
    jobElem.appendChild(skills)

    const accomplishments = doc.createElement('accomplishments')
    job.accomplishments.forEach(acc => addElement(accomplishments, 'item', acc))
    jobElem.appendChild(accomplishments)

    experience.appendChild(jobElem)
  })
  doc.documentElement.appendChild(experience)

  // Projects
  const projects = doc.createElement('projects')
  resume.projects.forEach(project => {
    const projectElem = doc.createElement('project')
    addElement(projectElem, 'name', project.name)
    addElement(projectElem, 'url', project.url)
    addElement(projectElem, 'description', project.description)

    const technologies = doc.createElement('technologies')
    project.technologies.forEach(tech => addElement(technologies, 'technology', tech))
    projectElem.appendChild(technologies)

    projects.appendChild(projectElem)
  })
  doc.documentElement.appendChild(projects)

  // Patents
  const patents = doc.createElement('patents')
  resume.patents.forEach(patent => {
    const patentElem = doc.createElement('patent')
    addElement(patentElem, 'number', patent.number)
    addElement(patentElem, 'title', patent.title)
    patents.appendChild(patentElem)
  })
  doc.documentElement.appendChild(patents)

  return new XMLSerializer().serializeToString(doc)
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resume: null,
  selectedRepo: null,
  isLoading: false,
  error: null,
  
  setSelectedRepo: (repo) => {
    set({ selectedRepo: repo })
    get().loadResume()
  },
  
  loadResume: async () => {
    const { selectedRepo } = get()
    if (!selectedRepo) return

    set({ isLoading: true, error: null })
    
    try {
      const [owner, repo] = selectedRepo.split('/')
      console.log('Loading resume from:', { owner, repo })
      
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: 'full-resume.xml',
      })
      
      if ('content' in response.data) {
        const xmlContent = atob(response.data.content)
        console.log('Loaded XML content:', xmlContent.substring(0, 100) + '...')
        
        const resume = parseXMLToResume(xmlContent)
        if (!resume) {
          throw new Error('Failed to parse resume XML')
        }
        
        console.log('Successfully parsed resume:', resume)
        set({ resume, isLoading: false })
      }
    } catch (error) {
      console.error('Error loading resume:', error)
      set({ error: 'Failed to load resume', isLoading: false })
    }
  },

  updateResume: async (resume: Resume) => {
    const { selectedRepo } = get()
    if (!selectedRepo) return

    set({ isLoading: true, error: null })

    try {
      const [owner, repo] = selectedRepo.split('/')
      const xml = resumeToXML(resume)
      
      // Get the current file to get its SHA
      const currentFile = await octokit.repos.getContent({
        owner,
        repo,
        path: 'full-resume.xml',
      })

      if ('sha' in currentFile.data) {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: 'full-resume.xml',
          message: 'Update resume',
          content: btoa(xml),
          sha: currentFile.data.sha,
        })
        
        set({ resume, isLoading: false })
      }
    } catch (error) {
      console.error('Error saving resume:', error)
      set({ error: 'Failed to save resume', isLoading: false })
    }
  }
})) 