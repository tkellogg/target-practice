/*
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

import { Box, FormControl, InputLabel, MenuItem, Select, CircularProgress } from '@mui/material'
import { useJobPostingStore } from '../stores/useJobPostingStore'
import { useResumeStore } from '../stores/useResumeStore'
import { useEffect, useState } from 'react'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
})

interface Repository {
  fullName: string
}

export const RepoSelector = () => {
  const { selectedRepo: resumeRepo, setSelectedRepo: setResumeRepo } = useResumeStore()
  const { setSelectedRepo: setJobRepo, loadPostings } = useJobPostingStore()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRepositories = async () => {
      try {
        const response = await octokit.repos.listForAuthenticatedUser({
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          affiliation: 'owner'
        })
        
        setRepositories(response.data
          .filter(repo => !repo.fork && !repo.owner.type.toLowerCase().includes('organization'))
          .map(repo => ({
            fullName: repo.full_name
          })))
      } catch (error) {
        console.error('Failed to load repositories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRepositories()
  }, [])

  const handleChange = (value: string) => {
    setResumeRepo(value)
    setJobRepo(value)
    loadPostings()
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 120 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel>Repository</InputLabel>
        <Select
          value={resumeRepo || ''}
          label="Repository"
          onChange={(e) => handleChange(e.target.value)}
        >
          {repositories.map(repo => (
            <MenuItem key={repo.fullName} value={repo.fullName}>
              {repo.fullName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
} 