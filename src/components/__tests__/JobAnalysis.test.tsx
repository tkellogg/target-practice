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

import { render, screen } from '@testing-library/react'
import { JobAnalysis } from '../JobAnalysis'
import { JobAnalysis as JobAnalysisType } from '../../types/JobPosting'

const mockAnalysis: JobAnalysisType = {
  title: 'Senior Software Engineer',
  roleDescription: 'Leading development of cloud-native applications',
  companyDescription: 'Fast-growing tech startup',
  requiredSkills: ['React', 'TypeScript', 'Node.js'],
  optionalSkills: ['AWS', 'Docker'],
  successCriteria: [
    'Strong technical leadership',
    'Experience with microservices',
    'Track record of delivering complex projects'
  ]
}

describe('JobAnalysis', () => {
  it('shows loading state when analyzing', () => {
    render(<JobAnalysis analyzing={true} analysis={null} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders nothing when no analysis and not analyzing', () => {
    const { container } = render(<JobAnalysis analyzing={false} analysis={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders full analysis when available', () => {
    render(<JobAnalysis analyzing={false} analysis={mockAnalysis} />)

    // Check headings
    expect(screen.getByText('Analyze Requirements')).toBeInTheDocument()
    expect(screen.getByText('Role Overview')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Required Skills')).toBeInTheDocument()
    expect(screen.getByText('Optional Skills')).toBeInTheDocument()
    expect(screen.getByText('Success Criteria')).toBeInTheDocument()

    // Check content
    expect(screen.getByText(mockAnalysis.roleDescription)).toBeInTheDocument()
    expect(screen.getByText(mockAnalysis.companyDescription)).toBeInTheDocument()

    // Check skills
    mockAnalysis.requiredSkills.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument()
    })
    mockAnalysis.optionalSkills.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument()
    })

    // Check success criteria
    mockAnalysis.successCriteria.forEach(criterion => {
      expect(screen.getByText(criterion)).toBeInTheDocument()
    })
  })
}) 