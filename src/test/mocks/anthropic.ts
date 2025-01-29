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

import { vi } from 'vitest'

// Store mock responses for different prompts
const mockResponses = new Map<string, string>()

// Default mock responses for common operations
const defaultResponses = {
  analyzeJobPosting: {
    content: [{
      type: 'text',
      text: JSON.stringify({
        title: 'Software Engineer',
        roleDescription: 'New role description',
        companyDescription: 'New company description',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        optionalSkills: ['TypeScript'],
        successCriteria: ['Good coding skills']
      })
    }]
  },
  generateSuggestions: {
    content: [{
      type: 'text',
      text: JSON.stringify({
        suggestions: [
          'Implemented CI/CD pipeline',
          'Led team of 5 engineers',
          'Reduced deployment time by 50%'
        ]
      })
    }]
  },
  augmentDescription: {
    content: [{
      type: 'text',
      text: JSON.stringify({
        content: 'Enhanced description with key achievements'
      })
    }]
  }
}

// Mock fetch for Anthropic API endpoints
export const mockFetch = vi.fn(async (url: string, options: RequestInit) => {
  const body = JSON.parse(options.body as string)
  const { prompt } = body

  if (url === '/api/analyze') {
    if (prompt.includes('analyze job posting') || prompt.includes('analyzing a job posting')) {
      // Try to parse the response to check if it's valid JSON
      try {
        const response = defaultResponses.analyzeJobPosting.content[0].text
        if (response === 'ERROR') {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Invalid JSON response'
          })
        }
        JSON.parse(response) // Just validate it's valid JSON
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: [{ type: 'text', text: response }] })
        })
      } catch (error) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Invalid JSON response'
        })
      }
    }

    if (prompt.includes('generate suggestions')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(defaultResponses.generateSuggestions)
      })
    }

    if (prompt.includes('augment description')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(defaultResponses.augmentDescription)
      })
    }

    if (prompt.includes('custom prompt')) {
      const mockResponse = mockResponses.get(prompt)
      if (!mockResponse) {
        return Promise.reject(new Error('Failed to call Anthropic API: No mock response found for prompt'))
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: [{ type: 'text', text: mockResponse }] })
      })
    }

    return Promise.reject(new Error('Failed to call Anthropic API: Unknown prompt'))
  }

  return Promise.reject(new Error('Failed to call Anthropic API: Unknown prompt'))
})

// Helper to set custom mock responses
export const setMockResponse = (prompt: string, response: string) => {
  mockResponses.set(prompt, response)
}

// Helper to reset mock responses
export const resetMockResponses = () => {
  mockResponses.clear()
  vi.clearAllMocks()
}

// Export mock fetch as global.fetch for testing
if (typeof global !== 'undefined') {
  (global as any).fetch = mockFetch
}

// Export helper for setting mock responses in tests
export const __setMockResponse = (prompt: string, response: string) => {
  if (prompt === 'analyze job posting') {
    defaultResponses.analyzeJobPosting.content[0].text = response
  } else if (prompt === 'generate suggestions') {
    defaultResponses.generateSuggestions.content[0].text = response
  } else if (prompt === 'augment description') {
    defaultResponses.augmentDescription.content[0].text = response
  } else {
    setMockResponse(prompt, response)
  }
} 