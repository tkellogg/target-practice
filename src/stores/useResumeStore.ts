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

import { create } from 'zustand'
import type { Resume } from '../types/Resume'
import { getFileContent, saveFile, parseRepoString } from '../utils/github'
import { parseXMLToResume, resumeToXML } from '../utils/xml'
import debounce from 'lodash/debounce'

interface ResumeStore {
  resume: Resume | null
  selectedRepo: string | null
  isLoading: boolean
  error: string | null
  setSelectedRepo: (repo: string) => void
  loadResume: () => Promise<void>
  updateResume: (resume: Resume) => void
  saveResume: () => Promise<void>
}

// Debounced save function
const debouncedSave = debounce(async (owner: string, repo: string, resume: Resume, set: any) => {
  try {
    const xml = resumeToXML(resume)
    await saveFile(owner, repo, 'full-resume.xml', xml)
  } catch (error) {
    console.error('Error saving resume:', error)
    set({ error: 'Failed to save resume' })
  }
}, 1000)

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resume: null,
  selectedRepo: null,
  isLoading: false,
  error: null,
  
  setSelectedRepo: (repo) => {
    set({ selectedRepo: repo })
    get().loadResume()
  },
  
  loadResume: async () => {
    const { selectedRepo } = get()
    if (!selectedRepo) return

    set({ isLoading: true, error: null })
    
    try {
      const { owner, repo } = parseRepoString(selectedRepo)
      console.log('Loading resume from:', { owner, repo })
      
      const xmlContent = await getFileContent(owner, repo, 'full-resume.xml')
      console.log('Loaded XML content:', xmlContent.substring(0, 100) + '...')
      
      const resume = parseXMLToResume(xmlContent)
      if (!resume) {
        throw new Error('Failed to parse resume XML')
      }
      
      console.log('Successfully parsed resume:', resume)
      set({ resume, isLoading: false })
    } catch (error) {
      console.error('Error loading resume:', error)
      set({ error: 'Failed to load resume', isLoading: false })
    }
  },

  updateResume: (resume: Resume) => {
    // Update local state immediately
    set({ resume })

    // Trigger debounced save to GitHub
    const { selectedRepo } = get()
    if (!selectedRepo) return

    const { owner, repo } = parseRepoString(selectedRepo)
    debouncedSave(owner, repo, resume, set)
  },

  saveResume: async () => {
    const { selectedRepo, resume } = get()
    if (!selectedRepo || !resume) return

    set({ isLoading: true, error: null })

    try {
      const { owner, repo } = parseRepoString(selectedRepo)
      const xml = resumeToXML(resume)
      await saveFile(owner, repo, 'full-resume.xml', xml)
      set({ isLoading: false })
    } catch (error) {
      console.error('Error saving resume:', error)
      set({ error: 'Failed to save resume', isLoading: false })
    }
  }
})) 