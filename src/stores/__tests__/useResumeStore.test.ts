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

import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useResumeStore } from '../useResumeStore'
import type { Resume } from '../../types/Resume'
import { setMockFile } from '../../test/mocks/github'

const mockResume: Resume = {
  personalInfo: {
    name: 'John Doe',
    address: '123 Main St',
    phone: '123-456-7890',
    email: 'john@example.com',
    description: 'Software Engineer'
  },
  experience: [{
    company: 'Tech Corp',
    city: 'San Francisco',
    dates: '2020-2023',
    positions: [{
      title: 'Software Engineer',
      startDate: '2020-01',
      endDate: '2023-12'
    }],
    skills: ['React', 'TypeScript'],
    description: 'Full-stack development',
    accomplishments: ['Built cool stuff'],
    anecdotes: []
  }],
  projects: [],
  patents: [],
  education: [{
    college: 'University',
    degree: 'BS Computer Science',
    grade: undefined
  }]
}

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore.setState({
      resume: null,
      selectedRepo: null,
      isLoading: false,
      error: null
    })
  })

  it('initializes with empty state', () => {
    const state = useResumeStore.getState()
    expect(state.resume).toBeNull()
    expect(state.selectedRepo).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets selected repo and loads resume', async () => {
    const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
      <resume>
        <personalInfo>
          <name>John Doe</name>
          <address>123 Main St</address>
          <phone>123-456-7890</phone>
          <email>john@example.com</email>
          <description>Software Engineer</description>
        </personalInfo>
        <experience>
          <job>
            <company>Tech Corp</company>
            <city>San Francisco</city>
            <dates>2020-2023</dates>
            <description>Full-stack development</description>
            <positions>
              <position startDate="2020-01" endDate="2023-12">Software Engineer</position>
            </positions>
            <skills>
              <skill>React</skill>
              <skill>TypeScript</skill>
            </skills>
            <accomplishments>
              <item>Built cool stuff</item>
            </accomplishments>
          </job>
        </experience>
        <education>
          <item>
            <college>University</college>
            <degree>BS Computer Science</degree>
          </item>
        </education>
        <projects></projects>
        <patents></patents>
      </resume>`

    setMockFile('tkellogg', 'resume-curated', 'full-resume.xml', mockXML)

    await act(async () => {
      useResumeStore.getState().setSelectedRepo('tkellogg/resume-curated')
    })

    const state = useResumeStore.getState()
    expect(state.selectedRepo).toBe('tkellogg/resume-curated')
    expect(state.resume).toEqual(mockResume)
  })

  it('updates resume', async () => {
    const updatedResume = {
      ...mockResume,
      personalInfo: {
        ...mockResume.personalInfo,
        name: 'Jane Doe'
      }
    }

    await act(async () => {
      useResumeStore.getState().setSelectedRepo('tkellogg/resume-curated')
      useResumeStore.getState().updateResume(updatedResume)
    })

    const state = useResumeStore.getState()
    expect(state.resume?.personalInfo.name).toBe('Jane Doe')
  })

  it('handles load errors', async () => {
    await act(async () => {
      useResumeStore.getState().setSelectedRepo('invalid/repo')
      await useResumeStore.getState().loadResume()
    })

    const state = useResumeStore.getState()
    expect(state.error).toBeTruthy()
    expect(state.isLoading).toBe(false)
  })

  it('saves resume', async () => {
    const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
      <resume>
        <personalInfo>
          <name>John Doe</name>
          <address>123 Main St</address>
          <phone>123-456-7890</phone>
          <email>john@example.com</email>
          <description>Software Engineer</description>
        </personalInfo>
        <experience>
          <job>
            <company>Tech Corp</company>
            <city>San Francisco</city>
            <dates>2020-2023</dates>
            <description>Full-stack development</description>
            <positions>
              <position startDate="2020-01" endDate="2023-12">Software Engineer</position>
            </positions>
            <skills>
              <skill>React</skill>
              <skill>TypeScript</skill>
            </skills>
            <accomplishments>
              <item>Built cool stuff</item>
            </accomplishments>
          </job>
        </experience>
        <education>
          <item>
            <college>University</college>
            <degree>BS Computer Science</degree>
          </item>
        </education>
        <projects></projects>
        <patents></patents>
      </resume>`

    setMockFile('tkellogg', 'resume-curated', 'full-resume.xml', mockXML)

    await act(async () => {
      useResumeStore.getState().setSelectedRepo('tkellogg/resume-curated')
      useResumeStore.setState({ resume: mockResume })
      await useResumeStore.getState().saveResume()
    })

    const state = useResumeStore.getState()
    expect(state.error).toBeNull()
    expect(state.isLoading).toBe(false)
  })
}) 