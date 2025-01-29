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

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { callAnthropicAPI } from '../anthropic'
import { mockFetch, setMockResponse, resetMockResponses } from '../../test/mocks/anthropic'

// Mock global fetch
vi.stubGlobal('fetch', mockFetch)

describe('Anthropic API', () => {
  beforeEach(() => {
    resetMockResponses()
    vi.clearAllMocks()
  })

  it('returns default response for analyze job posting prompt', async () => {
    const response = await callAnthropicAPI('analyze job posting')
    const data = JSON.parse(response)
    expect(data).toHaveProperty('title', 'Software Engineer')
    expect(data).toHaveProperty('roleDescription', 'New role description')
    expect(data).toHaveProperty('requiredSkills')
    expect(Array.isArray(data.requiredSkills)).toBe(true)
  })

  it('returns default response for generate suggestions prompt', async () => {
    const response = await callAnthropicAPI('generate suggestions')
    const data = JSON.parse(response)
    expect(data).toHaveProperty('suggestions')
    expect(Array.isArray(data.suggestions)).toBe(true)
    expect(data.suggestions).toHaveLength(3)
  })

  it('returns default response for augment description prompt', async () => {
    const response = await callAnthropicAPI('augment description')
    const data = JSON.parse(response)
    expect(data).toHaveProperty('content')
    expect(typeof data.content).toBe('string')
    expect(data.content).toBe('Enhanced description with key achievements')
  })

  it('returns custom mock response when set', async () => {
    const mockData = { custom: 'response' }
    const mockResponse = JSON.stringify(mockData)
    setMockResponse('custom prompt', mockResponse)
    const response = await callAnthropicAPI('custom prompt')
    expect(JSON.parse(response)).toEqual(mockData)
  })

  it('returns error response for unknown prompt', async () => {
    await expect(callAnthropicAPI('unknown prompt')).rejects.toThrow('Failed to call Anthropic API: Unknown prompt')
  })
}) 