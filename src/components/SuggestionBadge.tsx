/**
 * Copyright (c) 2024. See LICENSE for details.
 */

import { useState } from 'react'
import {
  IconButton,
  Badge,
  Tooltip,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  Button
} from '@mui/material'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import type { AISuggestion } from '../types/JobPostEditor'

interface SuggestionBadgeProps {
  suggestions: AISuggestion[]
  onApply: (feedback: string, acceptedSuggestions: string[]) => void
}

export function SuggestionBadge({ suggestions, onApply }: SuggestionBadgeProps) {
  console.log('SuggestionBadge rendered with:', { suggestions })
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [feedback, setFeedback] = useState('')
  const [checkedSuggestions, setCheckedSuggestions] = useState<string[]>(
    suggestions.filter(s => s.isAccepted).map(s => s.id)
  )

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleToggle = (id: string) => {
    setCheckedSuggestions(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id)
      }
      return [...prev, id]
    })
  }

  const handleSubmit = () => {
    onApply(feedback, checkedSuggestions)
    handleClose()
  }

  return (
    <>
      <Tooltip title="View AI Suggestions">
        <IconButton size="small" onClick={handleClick}>
          <Badge badgeContent={suggestions.length} color="primary">
            <LightbulbIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            AI Suggestions
          </Typography>
          
          <List>
            {suggestions.map((suggestion) => (
              <ListItem key={suggestion.id} dense>
                <Checkbox
                  edge="start"
                  checked={checkedSuggestions.includes(suggestion.id)}
                  onChange={() => handleToggle(suggestion.id)}
                />
                <ListItemText 
                  primary={suggestion.text}
                  secondary={suggestion.type.replace('_', ' ')}
                />
              </ListItem>
            ))}
          </List>

          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Add your feedback or clarifications here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSubmit}
            >
              Apply Changes
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
} 