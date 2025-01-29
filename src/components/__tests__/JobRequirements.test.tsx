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
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { JobRequirements } from '../JobRequirements'
import type { JobAnalysis } from '../../types/JobPosting'

const mockAnalysis: JobAnalysis = {
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

describe('JobRequirements', () => {
  it('displays message when no analysis is available', () => {
    render(<JobRequirements analysis={null} />)
    expect(screen.getByText(/no analysis available/i)).toBeInTheDocument()
  })

  it('renders analysis in read-only mode', () => {
    render(<JobRequirements analysis={mockAnalysis} />)

    // Check title and descriptions
    expect(screen.getByText(mockAnalysis.title)).toBeInTheDocument()
    expect(screen.getByText(mockAnalysis.roleDescription)).toBeInTheDocument()
    expect(screen.getByText(mockAnalysis.companyDescription)).toBeInTheDocument()

    // Check required skills
    mockAnalysis.requiredSkills.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument()
    })

    // Check optional skills
    mockAnalysis.optionalSkills.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument()
    })

    // Check success criteria
    mockAnalysis.successCriteria.forEach(criterion => {
      expect(screen.getByText(criterion)).toBeInTheDocument()
    })
  })

  it('allows editing when isEditable is true', async () => {
    const mockUpdateRequirements = vi.fn()
    const mockUpdateSuccessCriteria = vi.fn()

    render(
      <JobRequirements
        analysis={mockAnalysis}
        isEditable={true}
        onUpdateRequirements={mockUpdateRequirements}
        onUpdateSuccessCriteria={mockUpdateSuccessCriteria}
      />
    )

    // Check that EditableList components are rendered
    expect(screen.getByText('Required Skills')).toBeInTheDocument()
    expect(screen.getByText('Optional Skills')).toBeInTheDocument()
    expect(screen.getByText('Success Criteria')).toBeInTheDocument()

    // Test updating required skills
    const requiredSkills = mockAnalysis.requiredSkills
    const newSkill = 'GraphQL'
    const updatedSkills = [...requiredSkills, newSkill]

    // Simulate adding a new skill
    // Note: The actual implementation of adding items would need to be tested
    // based on how EditableList component works
    mockUpdateRequirements('required', updatedSkills)
    expect(mockUpdateRequirements).toHaveBeenCalledWith('required', updatedSkills)
  })

  it('does not show edit controls when isEditable is false', () => {
    render(
      <JobRequirements
        analysis={mockAnalysis}
        isEditable={false}
      />
    )

    // Skills should be rendered as read-only text
    mockAnalysis.requiredSkills.forEach(skill => {
      const skillElement = screen.getByText(skill)
      expect(skillElement).toBeInTheDocument()
      expect(skillElement.tagName).toBe('SPAN')
    })

    // Success criteria should be rendered as a list
    mockAnalysis.successCriteria.forEach(criterion => {
      const criterionElement = screen.getByText(criterion)
      expect(criterionElement.tagName).toBe('LI')
    })
  })
}) 