/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import React, { useState } from 'react'
import { IconButton, Popover, Box, Typography, Button, CircularProgress, List, ListItem, Checkbox } from '@mui/material'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import { Experience } from '../types/Resume'
import { generateDescriptionSuggestionsPrompt, generateSkillsSuggestionsPrompt, generateAccomplishmentsSuggestionsPrompt } from '../utils/prompts'
import { callAnthropicAPI } from '../utils/anthropic'

type SuggestionType = 'description' | 'skills' | 'accomplishments'

type Props = {
  experience: Experience
  type: SuggestionType
  anecdote: string
  onAccept: (suggestions: string[]) => void
}

export function AnecdoteAugmentation({ experience, type, anecdote, onAccept }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    setLoading(true)

    let prompt: string
    switch (type) {
      case 'description':
        prompt = generateDescriptionSuggestionsPrompt(experience, anecdote)
        break
      case 'skills':
        prompt = generateSkillsSuggestionsPrompt(experience, anecdote)
        break
      case 'accomplishments':
        prompt = generateAccomplishmentsSuggestionsPrompt(experience, anecdote)
        break
    }

    try {
      const response = await callAnthropicAPI(prompt)
      // Extract JSON from the response
      const json = JSON.parse(response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1))
      
      // Extract suggestions based on type
      const newSuggestions = type === 'description' 
        ? [json.description]
        : type === 'skills'
          ? json.skills
          : json.accomplishments

      setSuggestions(newSuggestions)
      setSelectedSuggestions([])
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
    setSuggestions([])
    setSelectedSuggestions([])
  }

  const handleAccept = () => {
    onAccept(type === 'description' ? suggestions : selectedSuggestions)
    handleClose()
  }

  const handleRegenerate = () => {
    setSuggestions([])
    setSelectedSuggestions([])
    handleClick({ currentTarget: anchorEl! } as React.MouseEvent<HTMLButtonElement>)
  }

  const handleToggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions(prev => {
      if (prev.includes(suggestion)) {
        return prev.filter(s => s !== suggestion)
      } else {
        return [...prev, suggestion]
      }
    })
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton onClick={handleClick} size="small" sx={{ ml: 1 }} title="Generate suggestions from anecdote">
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
          ) : suggestions.length > 0 ? (
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

                  <Box display="flex" justifyContent="space-between">
                    <Button onClick={handleClose} color="inherit" size="small">
                      Cancel
                    </Button>
                    <Button onClick={handleAccept} color="primary" size="small">
                      Accept
                    </Button>
                  </Box>
                </Box>
              ) : (
                // For skills and accomplishments, show as checkable list
                <>
                  <List dense>
                    {suggestions.map((suggestion, index) => (
                      <ListItem key={index} dense>
                        <Checkbox
                          edge="start"
                          checked={selectedSuggestions.includes(suggestion)}
                          onChange={() => handleToggleSuggestion(suggestion)}
                        />
                        <Typography variant="body2">{suggestion}</Typography>
                      </ListItem>
                    ))}
                  </List>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Button onClick={handleClose} color="inherit" size="small">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAccept}
                      color="primary"
                      size="small"
                      disabled={selectedSuggestions.length === 0}
                    >
                      Accept Selected
                    </Button>
                  </Box>
                </>
              )}

              <Button
                onClick={handleRegenerate}
                color="inherit"
                size="small"
                fullWidth
                sx={{ mt: 1 }}
              >
                Regenerate Suggestions
              </Button>
            </>
          ) : null}
        </Box>
      </Popover>
    </>
  )
} 