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

import { describe, it, expect } from 'vitest'
import { parseXMLToResume, resumeToXML } from '../xml'
import type { Resume } from '../../types/Resume'

const minimalResume: Resume = {
  personalInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St',
    phone: '555-0123',
    description: 'Software Engineer'
  },
  experience: [{
    company: 'Tech Corp',
    positions: [{
      title: 'Software Engineer',
      startDate: '2020-01',
      endDate: '2021-12'
    }],
    city: 'San Francisco',
    dates: '2020-2021',
    description: 'Software development',
    skills: ['JavaScript'],
    accomplishments: ['Built features']
  }],
  education: [{
    college: 'University',
    degree: 'BS Computer Science'
  }],
  projects: [],
  patents: []
}

const sampleResume: Resume = {
  personalInfo: {
    name: 'John Doe',
    address: '123 Main St, City, State 12345',
    phone: '(123) 456-7890',
    email: 'john@example.com',
    description: 'Experienced software engineer'
  },
  experience: [
    {
      company: 'Tech Corp',
      city: 'San Francisco',
      dates: '2020-2023',
      positions: [
        {
          title: 'Senior Software Engineer',
          startDate: '2022-01',
          endDate: '2023-12'
        },
        {
          title: 'Software Engineer',
          startDate: '2020-01',
          endDate: '2021-12'
        }
      ],
      skills: ['React', 'TypeScript', 'Node.js'],
      description: 'Led development of cloud applications',
      accomplishments: [
        'Reduced deployment time by 50%',
        'Led team of 5 engineers'
      ],
      anecdotes: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Implemented CI/CD pipeline',
          timestamp: '2024-01-01T00:00:00Z'
        }
      ]
    }
  ],
  projects: [
    {
      name: 'Open Source Project',
      url: 'https://github.com/example/project',
      description: 'A cool project',
      technologies: ['React', 'TypeScript'],
      startDate: '2023-01',
      endDate: '2023-12',
      skills: ['React', 'TypeScript'],
      accomplishments: ['Created awesome features']
    }
  ],
  patents: [
    {
      number: '12345',
      title: 'Amazing Innovation'
    }
  ],
  education: [
    {
      college: 'University of Technology',
      degree: 'BS in Computer Science',
      grade: '3.8 GPA'
    }
  ]
}

describe('XML Utils', () => {
  describe('resumeToXML', () => {
    it('converts resume to XML format', () => {
      const xml = resumeToXML(sampleResume)

      // Basic structure checks
      expect(xml).toContain('<resume>')
      expect(xml).toContain('</resume>')
      expect(xml).toContain('<personalInfo>')
      expect(xml).toContain('</personalInfo>')

      // Personal info checks
      expect(xml).toContain('<name>John Doe</name>')
      expect(xml).toContain('<email>john@example.com</email>')

      // Experience checks
      expect(xml).toContain('<experience>')
      expect(xml).toContain('<job>')
      expect(xml).toContain('<company>Tech Corp</company>')
      expect(xml).toContain('<positions>')
      expect(xml).toContain('<position startDate="2020-01" endDate="2021-12">Software Engineer</position>')
    })

    it('handles special characters in content', () => {
      const resumeWithSpecialChars = {
        ...sampleResume,
        personalInfo: {
          ...sampleResume.personalInfo,
          name: 'John & Jane Doe',
          description: 'Software & Data Engineer'
        }
      }

      const xml = resumeToXML(resumeWithSpecialChars)
      expect(xml).toContain('&amp;')
      expect(xml).not.toContain('&amp;amp;')
    })
  })

  describe('parseXMLToResume', () => {
    it('parses XML back to resume object', () => {
      const xml = resumeToXML(sampleResume)
      const parsed = parseXMLToResume(xml)

      expect(parsed).not.toBeNull()
      expect(parsed?.personalInfo.name).toBe(sampleResume.personalInfo.name)
      expect(parsed?.personalInfo.email).toBe(sampleResume.personalInfo.email)
      expect(parsed?.experience[0].company).toBe(sampleResume.experience[0].company)
      expect(parsed?.experience[0].positions[0].title).toBe(sampleResume.experience[0].positions[0].title)
    })

    it('returns null for invalid XML', () => {
      const result = parseXMLToResume('invalid xml')
      expect(result).toBeNull()
    })

    it('handles missing optional fields', () => {
      const minimalXML = `
        <resume>
          <personalInfo>
            <n>John Doe</n>
            <email>john@example.com</email>
            <address>123 Main St</address>
            <phone>555-0123</phone>
            <description>Software Engineer</description>
          </personalInfo>
          <experience>
            <job>
              <company>Tech Corp</company>
              <positions>
                <position startDate="2020-01" endDate="2021-12">Software Engineer</position>
              </positions>
              <city>San Francisco</city>
              <dates>2020-2021</dates>
              <description>Software development</description>
              <skills>
                <skill>JavaScript</skill>
              </skills>
              <accomplishments>
                <item>Built features</item>
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
        </resume>
      `
      const parsed = parseXMLToResume(minimalXML)

      expect(parsed).not.toBeNull()
      expect(parsed?.experience[0].anecdotes).toEqual([])
      expect(parsed?.education[0].grade).toBeUndefined()
    })
  })
}) 