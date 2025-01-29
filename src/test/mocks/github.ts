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

// In-memory storage for files
const fileStorage = new Map<string, string>()

// Helper function to encode string to base64
const encodeBase64 = (str: string) => btoa(str)

// Helper function to decode base64 to string
const decodeBase64 = (str: string) => atob(str)

// Mock Octokit instance
export const mockOctokit = {
  repos: {
    getContent: vi.fn(({ owner, repo, path }) => {
      const key = `${owner}/${repo}/${path}`
      if (path === 'job-postings') {
        // Return directory listing
        const files = Array.from(fileStorage.keys())
          .filter(k => k.startsWith(`${owner}/${repo}/job-postings/`))
          .map(k => k.replace(`${owner}/${repo}/`, ''))
        return Promise.resolve({
          status: 200,
          data: files.map(path => ({
            type: 'file',
            path,
            name: path.split('/').pop()
          }))
        })
      }
      const content = fileStorage.get(key)
      if (!content) {
        return Promise.reject(new Error('Not Found'))
      }
      return Promise.resolve({
        status: 200,
        data: {
          content: encodeBase64(content),
          sha: 'test-sha',
          download_url: 'test-sha'
        }
      })
    }),
    createOrUpdateFileContents: vi.fn(({ owner, repo, path, content }) => {
      const key = `${owner}/${repo}/${path}`
      fileStorage.set(key, decodeBase64(content))
      return Promise.resolve({
        status: 200,
        data: {
          content: {
            sha: 'test-sha'
          }
        }
      })
    }),
    listForAuthenticatedUser: vi.fn(() => {
      return Promise.resolve({
        status: 200,
        data: [
          {
            name: 'resume-curated',
            owner: { login: 'tkellogg' },
            fork: false,
            full_name: 'tkellogg/resume-curated'
          }
        ]
      })
    }),
    deleteFile: vi.fn(({ owner, repo, path }) => {
      const key = `${owner}/${repo}/${path}`
      if (!fileStorage.has(key)) {
        return Promise.reject(new Error('Not Found'))
      }
      fileStorage.delete(key)
      return Promise.resolve({
        status: 200,
        data: {
          commit: {
            sha: 'test-sha'
          }
        }
      })
    })
  }
}

// Helper to reset storage between tests
export const resetStorage = () => {
  fileStorage.clear()
  vi.clearAllMocks()
}

// Helper to pre-populate storage for tests
export const setMockFile = (owner: string, repo: string, path: string, content: string) => {
  const key = `${owner}/${repo}/${path}`
  fileStorage.set(key, content)
} 