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

// Store mock responses for different prompts
const mockResponses = new Map<string, string>()

// Default mock responses for common operations
const defaultResponses = {
  analyzeJobPosting: JSON.stringify({
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
  }),
  generateSuggestions: JSON.stringify({
    suggestions: [
      'Implemented CI/CD pipeline reducing deployment time by 50%',
      'Led team of 5 engineers in microservices migration',
      'Reduced cloud costs by 30% through infrastructure optimization'
    ]
  }),
  augmentDescription: JSON.stringify({
    content: 'Enhanced description highlighting key achievements and technical expertise'
  })
}

// Mock API call function
export const callAnthropicAPI = async (prompt: string): Promise<string> => {
  // Check for custom mock response
  const customResponse = mockResponses.get(prompt)
  if (customResponse) {
    try {
      // Verify it's valid JSON
      JSON.parse(customResponse)
      return customResponse
    } catch (error) {
      return Promise.reject(new Error('Invalid JSON response'))
    }
  }

  // Return default response based on prompt content
  if (prompt.includes('analyze job posting')) {
    return defaultResponses.analyzeJobPosting
  }
  if (prompt.includes('generate suggestions')) {
    return defaultResponses.generateSuggestions
  }
  if (prompt.includes('augment description')) {
    return defaultResponses.augmentDescription
  }

  return Promise.reject(new Error('No mock response configured for this prompt'))
}

// Helper to set custom mock responses
export const __setMockResponse = (prompt: string, response: string) => {
  mockResponses.set(prompt, response)
}

// Helper to reset mock responses
export const __resetMockResponses = () => {
  mockResponses.clear()
}

// Helper to get the last prompt sent (for assertions)
let lastPrompt: string | null = null
export const __getLastPrompt = () => lastPrompt
export const __resetLastPrompt = () => { lastPrompt = null } 