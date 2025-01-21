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

import React, { useState } from 'react'
import { IconButton, Popover, Box, Typography, Button, CircularProgress, List, ListItem, Checkbox, TextField } from '@mui/material'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Experience, Project } from '../types/Resume'
import { generateDescriptionSuggestionsPrompt, generateSkillsSuggestionsPrompt, generateAccomplishmentsSuggestionsPrompt } from '../utils/prompts'
import { callAnthropicAPI } from '../utils/anthropic'

type SuggestionType = 'description' | 'skills' | 'accomplishments'

type Props = {
  experience: Experience | Project
  type: SuggestionType
  anecdote: string
  onAccept: (suggestions: string[]) => void
}

export function AnecdoteAugmentation({ experience, type, anecdote, onAccept }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    setLoading(true)
    setError(null)

    let prompt: string
    switch (type) {
      case 'description':
        prompt = generateDescriptionSuggestionsPrompt(experience, anecdote, customPrompt)
        break
      case 'skills':
        prompt = generateSkillsSuggestionsPrompt(experience, anecdote, customPrompt)
        break
      case 'accomplishments':
        prompt = generateAccomplishmentsSuggestionsPrompt(experience, anecdote, customPrompt)
        break
    }

    try {
      const response = await callAnthropicAPI(prompt)
      // Extract JSON from the response
      const json = JSON.parse(response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1))
      if (!json.suggestions || !Array.isArray(json.suggestions)) {
        throw new Error('Invalid response format')
      }
      setSuggestions(json.suggestions)
      setSelectedSuggestions([])
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      setError('Failed to generate suggestions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
    setSuggestions([])
    setSelectedSuggestions([])
    setError(null)
  }

  const handleAccept = () => {
    onAccept(type === 'description' ? [suggestions[0]] : selectedSuggestions)
    handleClose()
  }

  const handleRegenerate = () => {
    setSuggestions([])
    setSelectedSuggestions([])
    handleClick({ currentTarget: anchorEl! } as React.MouseEvent<HTMLButtonElement>)
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton onClick={handleClick} size="small" sx={{ ml: 1 }}>
        <AutoFixHighIcon fontSize="small" />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : suggestions && suggestions.length > 0 ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Suggested {type === 'description' ? 'Description' : type === 'skills' ? 'Skills' : 'Accomplishments'}:
              </Typography>

              {type === 'description' ? (
                // For description, show current and suggested text with accept/reject
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    mb: 2,
                    bgcolor: theme => theme.palette.mode === 'light' ? '#ffdce0' : '#3c1f1f',
                    color: theme => theme.palette.mode === 'light' ? '#67060c' : '#f9d1d5',
                    p: 1,
                    borderRadius: '2px'
                  }}>
                    {experience.description}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Suggested:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    mb: 2,
                    bgcolor: theme => theme.palette.mode === 'light' ? '#e6ffec' : '#1f3420',
                    color: theme => theme.palette.mode === 'light' ? '#1a7f37' : '#aff5b4',
                    p: 1,
                    borderRadius: '2px'
                  }}>
                    {suggestions[0]}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button onClick={handleClose} sx={{ mr: 1 }}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => onAccept([suggestions[0]])}
                    >
                      Accept
                    </Button>
                  </Box>

                  <Button
                    onClick={handleRegenerate}
                    startIcon={<RefreshIcon />}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Regenerate
                  </Button>
                </Box>
              ) : (
                // For skills and accomplishments, show checkboxes
                <>
                  <List>
                    {suggestions.map((suggestion, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <Checkbox
                          checked={selectedSuggestions.includes(suggestion)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuggestions([...selectedSuggestions, suggestion])
                            } else {
                              setSelectedSuggestions(selectedSuggestions.filter(s => s !== suggestion))
                            }
                          }}
                        />
                        <Typography variant="body2">{suggestion}</Typography>
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button onClick={handleClose} sx={{ mr: 1 }}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleAccept}
                      disabled={selectedSuggestions.length === 0}
                    >
                      Accept Selected
                    </Button>
                  </Box>

                  <Button
                    onClick={handleRegenerate}
                    startIcon={<RefreshIcon />}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Regenerate
                  </Button>
                </>
              )}
            </>
          ) : (
            <Typography>No suggestions available. Try adjusting the anecdote.</Typography>
          )}

          {/* Custom prompt input */}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Custom prompt (optional)"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              multiline
              rows={2}
            />
          </Box>
        </Box>
      </Popover>
    </>
  )
} 