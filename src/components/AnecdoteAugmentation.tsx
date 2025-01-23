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
import { IconButton, Popover, Box, Typography, Button, CircularProgress, List, ListItem, Checkbox, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel } from '@mui/material'
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

export const AnecdoteAugmentation: React.FC<Props> = ({ experience, type, anecdote, onAccept }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<boolean[]>([])
  const [customPrompt, setCustomPrompt] = useState('')

  const handleOpen = async () => {
    setOpen(true)
    await generateSuggestions()
  }

  const handleClose = () => {
    setOpen(false)
    setSuggestions([])
    setSelectedSuggestions([])
    setCustomPrompt('')
  }

  const generateSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/augment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience,
          type,
          anecdote,
          customPrompt: customPrompt.trim() || undefined
        })
      })
      const data = await response.json()
      setSuggestions(data.suggestions)
      setSelectedSuggestions(new Array(data.suggestions.length).fill(false))
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    const acceptedSuggestions = suggestions.filter((_, i) => selectedSuggestions[i])
    onAccept(acceptedSuggestions)
    handleClose()
  }

  const handleRegenerateClick = () => {
    generateSuggestions()
  }

  const handleCustomPromptKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      generateSuggestions()
    }
  }

  return (
    <>
      <IconButton 
        onClick={handleOpen}
        disabled={!anecdote}
        title={anecdote ? 'Generate suggestions from anecdote' : 'Add an anecdote first'}
      >
        <AutoFixHighIcon />
      </IconButton>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {type === 'description' ? 'Suggested Description' : `Suggested ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </DialogTitle>

        <DialogContent>
          {/* Custom prompt input */}
          <TextField
            fullWidth
            placeholder="Add custom instructions to guide the AI..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyPress={handleCustomPromptKeyPress}
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Typography>Generating suggestions...</Typography>
          ) : type === 'description' ? (
            // For description, show diff view
            <Box sx={{ 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              p: 2,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1
            }}>
              <Typography component="div" sx={{ color: 'error.main', textDecoration: 'line-through' }}>
                {experience.description}
              </Typography>
              <Typography component="div" sx={{ color: 'success.main', mt: 1 }}>
                {suggestions[0]}
              </Typography>
            </Box>
          ) : (
            // For skills and accomplishments, show checkboxes
            suggestions.map((suggestion, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={selectedSuggestions[index]}
                    onChange={(e) => {
                      const newSelected = [...selectedSuggestions]
                      newSelected[index] = e.target.checked
                      setSelectedSuggestions(newSelected)
                    }}
                  />
                }
                label={suggestion}
              />
            ))
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleRegenerateClick} disabled={loading}>
            Regenerate
          </Button>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAccept} 
            variant="contained" 
            disabled={loading || (type !== 'description' && !selectedSuggestions.some(s => s))}
          >
            Accept {type === 'description' ? 'Changes' : 'Selected'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 