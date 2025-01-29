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

import { describe, it, expect, beforeEach } from 'vitest'
import { getFileContent, saveFile, checkFileExists, listRepos, parseRepoString, setOctokit } from '../github'
import { mockOctokit, setMockFile, resetStorage } from '../../test/mocks/github'

describe('GitHub Utils', () => {
  beforeEach(() => {
    resetStorage()
    setOctokit(mockOctokit)
  })

  describe('parseRepoString', () => {
    it('parses owner/repo format', () => {
      const result = parseRepoString('tkellogg/resume-curated')
      expect(result).toEqual({ owner: 'tkellogg', repo: 'resume-curated' })
    })

    it('returns null for invalid format', () => {
      const result = parseRepoString('invalid-format')
      expect(result).toBeNull()
    })
  })

  describe('checkFileExists', () => {
    it('returns download URL for existing file', async () => {
      setMockFile('tkellogg', 'resume-curated', 'test.txt', 'content')
      const result = await checkFileExists('tkellogg', 'resume-curated', 'test.txt')
      expect(result).toBe('test-sha')
    })

    it('returns null for non-existent file', async () => {
      const result = await checkFileExists('tkellogg', 'resume-curated', 'nonexistent.txt')
      expect(result).toBeNull()
    })
  })

  describe('getFileContent', () => {
    it('returns content for existing file', async () => {
      setMockFile('tkellogg', 'resume-curated', 'test.txt', 'content')
      const content = await getFileContent('tkellogg', 'resume-curated', 'test.txt')
      expect(content).toBe('content')
    })

    it('throws error for non-existent file', async () => {
      await expect(getFileContent('tkellogg', 'resume-curated', 'nonexistent.txt'))
        .rejects.toThrow('Failed to get file content')
    })
  })

  describe('saveFile', () => {
    it('successfully writes file content', async () => {
      await saveFile('tkellogg', 'resume-curated', 'test.txt', 'new content')
      const content = await getFileContent('tkellogg', 'resume-curated', 'test.txt')
      expect(content).toBe('new content')
    })

    it('overwrites existing file', async () => {
      setMockFile('tkellogg', 'resume-curated', 'test.txt', 'old content')
      await saveFile('tkellogg', 'resume-curated', 'test.txt', 'new content')
      const content = await getFileContent('tkellogg', 'resume-curated', 'test.txt')
      expect(content).toBe('new content')
    })
  })

  describe('listRepos', () => {
    it('returns list of non-fork repos', async () => {
      const repos = await listRepos()
      expect(repos).toEqual([{ fullName: 'tkellogg/resume-curated' }])
    })
  })
}) 