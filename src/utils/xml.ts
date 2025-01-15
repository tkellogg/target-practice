/**
 * Copyright (c) 2025. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import type { Resume } from '../types/Resume'

/**
 * Parses XML content into a Resume object
 */
export function parseXMLToResume(xml: string): Resume | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

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
      description: job.querySelector('description')?.textContent || '',
      city: job.querySelector('city')?.textContent || 'USA',
      positions: Array.from(job.querySelectorAll('positions > position')).map(pos => ({
        title: pos.textContent || '',
        startDate: pos.getAttribute('startDate') || '',
        endDate: pos.getAttribute('endDate') || ''
      })),
      skills: Array.from(job.querySelectorAll('skills > skill')).map(s => s.textContent || ''),
      accomplishments: Array.from(job.querySelectorAll('accomplishments > item')).map(a => a.textContent || ''),
      anecdotes: Array.from(job.querySelectorAll('anecdotes > anecdote')).map(anecdote => ({
        id: anecdote.getAttribute('id') || '',
        timestamp: anecdote.getAttribute('timestamp') || '',
        content: anecdote.querySelector('content')?.textContent || '',
        conversationContext: (() => {
          const context = anecdote.querySelector('conversationContext')
          if (!context) return undefined
          return {
            role: context.querySelector('role')?.textContent || '',
            messages: Array.from(context.querySelectorAll('messages > message')).map(msg => ({
              role: msg.getAttribute('role') as 'user' | 'assistant',
              content: msg.textContent || ''
            }))
          }
        })()
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

/**
 * Converts a Resume object to XML string
 */
export function resumeToXML(resume: Resume): string {
  const doc = document.implementation.createDocument(null, 'resume', null)
  
  function addElement(parent: Element, tag: string, text: string) {
    const elem = doc.createElement(tag)
    elem.textContent = text
    parent.appendChild(elem)
    return elem
  }

  // Personal Info
  const personalInfo = doc.createElement('personalInfo')
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
    addElement(jobElem, 'city', job.city)

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

  return new XMLSerializer().serializeToString(doc)
} 