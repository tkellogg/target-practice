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

import { useState, useEffect } from 'react'
import { Resume } from '../types/Resume'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
})

const parseXMLToResume = (xml: string): Resume | null => {
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

export function useResume(selectedRepo: string | null) {
  const [resume, setResume] = useState<Resume | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedRepo) {
      setResume(null)
      return
    }

    const loadResume = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [owner, repo] = selectedRepo.split('/')
        console.log('Loading resume from:', { owner, repo })
        
        const response = await octokit.repos.getContent({
          owner,
          repo,
          path: 'full-resume.xml'
        })

        if (!('content' in response.data)) {
          throw new Error('Invalid response from GitHub')
        }

        const xmlContent = atob(response.data.content)
        console.log('Loaded XML content:', xmlContent.substring(0, 100) + '...')
        
        const resume = parseXMLToResume(xmlContent)
        if (!resume) {
          throw new Error('Failed to parse resume XML')
        }

        console.log('Successfully parsed resume:', resume)
        setResume(resume)
      } catch (error) {
        console.error('Failed to load resume:', error)
        setError('Failed to load resume')
      } finally {
        setIsLoading(false)
      }
    }

    loadResume()
  }, [selectedRepo])

  return { resume, isLoading, error }
} 