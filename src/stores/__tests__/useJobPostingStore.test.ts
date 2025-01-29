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

import { act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useJobPostingStore } from '../useJobPostingStore'
import type { JobPosting, JobAnalysis } from '../../types/JobPosting'
import { __setMockResponse } from '../../test/mocks/anthropic'
import { setMockFile, resetStorage } from '../../test/mocks/github'

const mockJobPosting: JobPosting = {
  id: 'test-id',
  company: 'Test Company',
  title: 'Software Engineer',
  url: 'https://example.com/job',
  rawText: 'This is a test job posting',
  analysis: {
    title: 'Software Engineer',
    roleDescription: 'Building awesome software',
    companyDescription: 'Great tech company',
    requiredSkills: ['JavaScript', 'React'],
    optionalSkills: ['TypeScript'],
    successCriteria: ['Good coding skills']
  }
}

describe('useJobPostingStore', () => {
  beforeEach(() => {
    resetStorage()
    useJobPostingStore.setState({
      postings: [],
      selectedPosting: null,
      selectedRepo: null,
      isLoading: false,
      error: null
    })
    // Pre-populate storage with empty job postings directory
    setMockFile('tkellogg', 'resume-curated', 'job-postings', JSON.stringify({
      type: 'dir',
      entries: []
    }))
  })

  it('initializes with empty state', () => {
    const state = useJobPostingStore.getState()
    expect(state.postings).toEqual([])
    expect(state.selectedPosting).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('creates a new posting', async () => {
    await act(async () => {
      useJobPostingStore.setState({ selectedRepo: 'tkellogg/resume-curated' })
      await useJobPostingStore.getState().createPosting(mockJobPosting)
    })

    const state = useJobPostingStore.getState()
    expect(state.postings).toHaveLength(1)
    expect(state.postings[0]).toEqual(mockJobPosting)
  })

  it('selects a posting', () => {
    act(() => {
      useJobPostingStore.setState({ selectedRepo: 'tkellogg/resume-curated' })
      useJobPostingStore.getState().createPosting(mockJobPosting)
      useJobPostingStore.getState().setSelectedPosting(mockJobPosting)
    })

    const state = useJobPostingStore.getState()
    expect(state.selectedPosting).toEqual(mockJobPosting)
  })

  it('updates a posting', async () => {
    await act(async () => {
      useJobPostingStore.setState({ selectedRepo: 'tkellogg/resume-curated' })
      await useJobPostingStore.getState().createPosting(mockJobPosting)
    })

    const updatedPosting = {
      ...mockJobPosting,
      title: 'Senior Software Engineer'
    }

    await act(async () => {
      await useJobPostingStore.getState().updatePosting(updatedPosting)
    })

    const state = useJobPostingStore.getState()
    expect(state.postings[0].title).toBe('Senior Software Engineer')
  })

  it('updates requirements', async () => {
    await act(async () => {
      useJobPostingStore.setState({ selectedRepo: 'tkellogg/resume-curated' })
      await useJobPostingStore.getState().createPosting(mockJobPosting)
      useJobPostingStore.getState().setSelectedPosting(mockJobPosting)
    })

    const newRequiredSkills = ['JavaScript', 'React', 'Node.js']
    
    await act(async () => {
      await useJobPostingStore.getState().updateRequirements(mockJobPosting, 'required', newRequiredSkills)
    })

    const state = useJobPostingStore.getState()
    expect(state.selectedPosting?.analysis?.requiredSkills).toEqual(newRequiredSkills)
  })

  it('analyzes a posting', async () => {
    const mockAnalysisResponse = {
      title: 'Software Engineer',
      roleDescription: 'New role description',
      companyDescription: 'New company description',
      requiredSkills: ['JavaScript', 'React'],
      optionalSkills: ['TypeScript'],
      successCriteria: ['Good coding skills']
    }

    __setMockResponse('analyze job posting', JSON.stringify(mockAnalysisResponse))

    await act(async () => {
      useJobPostingStore.setState({ selectedRepo: 'tkellogg/resume-curated' })
      await useJobPostingStore.getState().createPosting({
        ...mockJobPosting,
        analysis: undefined
      })
    })

    await act(async () => {
      await useJobPostingStore.getState().analyzePosting({
        ...mockJobPosting,
        analysis: undefined
      })
    })

    const state = useJobPostingStore.getState()
    expect(state.postings[0].analysis).toEqual(mockAnalysisResponse)
  })

  it('handles analysis errors', async () => {
    __setMockResponse('analyze job posting', 'invalid json')

    await act(async () => {
      useJobPostingStore.setState({ selectedRepo: 'tkellogg/resume-curated' })
      await useJobPostingStore.getState().createPosting({
        ...mockJobPosting,
        analysis: undefined
      })
    })

    await act(async () => {
      await useJobPostingStore.getState().analyzePosting({
        ...mockJobPosting,
        analysis: undefined
      })
    })

    const state = useJobPostingStore.getState()
    expect(state.error).toBe('Failed to analyze job posting')
  })
}) 