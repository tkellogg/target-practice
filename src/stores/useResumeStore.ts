/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { create } from 'zustand'
import type { Resume } from '../types/Resume'
import { getFileContent, saveFile, parseRepoString } from '../utils/github'

interface ResumeStore {
  resume: Resume | null
  selectedRepo: string | null
  isLoading: boolean
  error: string | null
  setSelectedRepo: (repo: string) => void
  loadResume: () => Promise<void>
  updateResume: (resume: Resume) => Promise<void>
}

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
      accomplishments: Array.from(job.querySelectorAll('accomplishments > item')).map(a => a.textContent || ''),
      anecdotes: Array.from(job.querySelectorAll('anecdotes > anecdote')).map(a => ({
        id: a.getAttribute('id') || crypto.randomUUID(),
        content: a.querySelector('content')?.textContent || '',
        timestamp: a.getAttribute('timestamp') || new Date().toISOString(),
        conversationContext: a.querySelector('conversationContext') ? {
          role: a.querySelector('conversationContext role')?.textContent || '',
          messages: Array.from(a.querySelectorAll('conversationContext messages message')).map(m => ({
            role: m.getAttribute('role') as 'user' | 'assistant',
            content: m.textContent || ''
          }))
        } : undefined
      }))
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
    return elem
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

    if (job.anecdotes?.length) {
      const anecdotes = doc.createElement('anecdotes')
      job.anecdotes.forEach(anecdote => {
        const anecdoteElem = doc.createElement('anecdote')
        anecdoteElem.setAttribute('id', anecdote.id)
        anecdoteElem.setAttribute('timestamp', anecdote.timestamp)

        const contentElem = doc.createElement('content')
        contentElem.textContent = anecdote.content
        anecdoteElem.appendChild(contentElem)

        if (anecdote.conversationContext) {
          const contextElem = doc.createElement('conversationContext')
          const roleElem = doc.createElement('role')
          roleElem.textContent = anecdote.conversationContext.role
          contextElem.appendChild(roleElem)

          const messagesElem = doc.createElement('messages')
          anecdote.conversationContext.messages.forEach(msg => {
            const messageElem = doc.createElement('message')
            messageElem.setAttribute('role', msg.role)
            messageElem.textContent = msg.content
            messagesElem.appendChild(messageElem)
          })
          contextElem.appendChild(messagesElem)
          anecdoteElem.appendChild(contextElem)
        }

        anecdotes.appendChild(anecdoteElem)
      })
      jobElem.appendChild(anecdotes)
    }

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

  // Format XML with proper indentation
  const serializer = new XMLSerializer()
  const xmlStr = serializer.serializeToString(doc)
  
  // Use DOMParser to reparse and format
  const parser = new DOMParser()
  const formattedDoc = parser.parseFromString(xmlStr, 'text/xml')
  
  // Pretty print with 2-space indentation
  const formatted = serializer.serializeToString(formattedDoc)
    .replace(/></g, '>\n<')
    .split('\n')
    .map((line, i, arr) => {
      if (i === 0) return line; // First line
      if (i === arr.length - 1) return line; // Last line
      const indent = line.match(/<\//g) ? 2 : 4; // Less indent for closing tags
      return ' '.repeat(indent) + line;
    })
    .join('\n');

  return formatted;
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
      const { owner, repo } = parseRepoString(selectedRepo)
      console.log('Loading resume from:', { owner, repo })
      
      const xmlContent = await getFileContent(owner, repo, 'full-resume.xml')
      console.log('Loaded XML content:', xmlContent.substring(0, 100) + '...')
      
      const resume = parseXMLToResume(xmlContent)
      if (!resume) {
        throw new Error('Failed to parse resume XML')
      }
      
      console.log('Successfully parsed resume:', resume)
      set({ resume, isLoading: false })
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
      const { owner, repo } = parseRepoString(selectedRepo)
      const xml = resumeToXML(resume)
      
      await saveFile(owner, repo, 'full-resume.xml', xml, 'Update resume')
      set({ resume, isLoading: false })
    } catch (error) {
      console.error('Error saving resume:', error)
      set({ error: 'Failed to save resume', isLoading: false })
    }
  }
})) 