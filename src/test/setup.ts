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

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { mockOctokit, resetStorage as resetGithubStorage } from './mocks/github'
import { mockFetch, resetMockResponses } from './mocks/anthropic'

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => mockOctokit)
}))

// Mock fetch for Anthropic API calls
global.fetch = vi.fn(mockFetch) as unknown as typeof fetch

// Automatically cleanup after each test
afterEach(() => {
  cleanup()
  resetGithubStorage()
  resetMockResponses()
})

beforeEach(() => {
  // Mock environment variables
  process.env.VITE_GH_ACCESS_KEY = 'test-gh-token'
  process.env.VITE_ANTH_API_KEY = 'test-anthropic-key'

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock crypto.randomUUID
  vi.spyOn(global.crypto, 'randomUUID').mockImplementation(() => '123e4567-e89b-12d3-a456-426614174000')

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: new URL('http://localhost:3001'),
    writable: true
  })
}) 