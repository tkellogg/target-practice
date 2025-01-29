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

// In-memory storage for files
const fileStorage = new Map<string, string>()

// Mock GitHub API functions
export const checkFileExists = async (owner: string, repo: string, path: string): Promise<boolean> => {
  const key = `${owner}/${repo}/${path}`
  return fileStorage.has(key)
}

export const getFileContent = async (owner: string, repo: string, path: string): Promise<string> => {
  const key = `${owner}/${repo}/${path}`
  const content = fileStorage.get(key)
  if (!content) {
    throw new Error(`File not found: ${path}`)
  }
  return content
}

export const writeFile = async (owner: string, repo: string, path: string, content: string): Promise<void> => {
  const key = `${owner}/${repo}/${path}`
  fileStorage.set(key, content)
}

export const listRepos = async (): Promise<Array<{ name: string, full_name: string, fork: boolean }>> => {
  return [
    { name: 'resume-curated', full_name: 'tkellogg/resume-curated', fork: false },
    { name: 'personal-site', full_name: 'tkellogg/personal-site', fork: false },
    { name: 'forked-repo', full_name: 'tkellogg/forked-repo', fork: true }
  ]
}

// Helper to reset storage between tests
export const __resetStorage = () => {
  fileStorage.clear()
}

// Helper to pre-populate storage for tests
export const __setMockFile = (owner: string, repo: string, path: string, content: string) => {
  const key = `${owner}/${repo}/${path}`
  fileStorage.set(key, content)
} 