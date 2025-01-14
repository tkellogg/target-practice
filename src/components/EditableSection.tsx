/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { EditableText } from './EditableText'
import { EditableList } from './EditableList'
import { Experience } from '../types/Resume'
import { ResumeSection } from './ResumeSection'
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore'
import { AnecdoteAugmentation } from './AnecdoteAugmentation'
import Markdown from 'markdown-to-jsx'

interface Props {
  title: string
  description?: string
  skills?: string[]
  accomplishments?: string[]
  onDescriptionChange?: (value: string) => void
  onSkillsChange?: (value: string[]) => void
  onAccomplishmentsChange?: (value: string[]) => void
  experience?: Experience
}

export function EditableSection({
  title,
  description,
  skills,
  accomplishments,
  onDescriptionChange,
  onSkillsChange,
  onAccomplishmentsChange,
  experience
}: Props) {
  const hasAnecdotes = experience?.anecdotes && experience.anecdotes.length > 0
  const latestAnecdote = hasAnecdotes ? experience!.anecdotes![0].content : ''

  const handleAcceptSuggestions = (type: 'description' | 'skills' | 'accomplishments', suggestions: string[]) => {
    if (type === 'description' && onDescriptionChange) {
      onDescriptionChange(suggestions[0])
    } else if (type === 'skills' && onSkillsChange && skills) {
      onSkillsChange([...skills, ...suggestions])
    } else if (type === 'accomplishments' && onAccomplishmentsChange && accomplishments) {
      onAccomplishmentsChange([...accomplishments, ...suggestions])
    }
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}

      {description !== undefined && onDescriptionChange && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">Description</Typography>
            {hasAnecdotes && (
              <AnecdoteAugmentation
                experience={experience!}
                type="description"
                anecdote={latestAnecdote}
                onAccept={(suggestions) => handleAcceptSuggestions('description', suggestions)}
              />
            )}
          </Box>
          <EditableText
            value={description}
            onChange={onDescriptionChange}
            multiline
          />
        </Box>
      )}

      {skills !== undefined && onSkillsChange && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">Skills</Typography>
            {hasAnecdotes && (
              <AnecdoteAugmentation
                experience={experience!}
                type="skills"
                anecdote={latestAnecdote}
                onAccept={(suggestions) => handleAcceptSuggestions('skills', suggestions)}
              />
            )}
          </Box>
          <EditableList
            items={skills}
            title="skill"
            onChange={onSkillsChange}
          />
        </Box>
      )}

      {accomplishments !== undefined && onAccomplishmentsChange && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">Accomplishments</Typography>
            {hasAnecdotes && (
              <AnecdoteAugmentation
                experience={experience!}
                type="accomplishments"
                anecdote={latestAnecdote}
                onAccept={(suggestions) => handleAcceptSuggestions('accomplishments', suggestions)}
              />
            )}
          </Box>
          <EditableList
            items={accomplishments}
            title="accomplishment"
            onChange={onAccomplishmentsChange}
          />
        </Box>
      )}

      {experience && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
            <Typography variant="subtitle2">Anecdotes</Typography>
            <IconButton 
              onClick={() => {
                useExperienceConversationStore.getState().setExperience(experience);
                useExperienceConversationStore.getState().setOpen(true);
              }} 
              size="small" 
              sx={{ ml: 1 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          {experience.anecdotes?.map((anecdote, i) => (
            <Box key={anecdote.id} sx={{ mt: 1 }}>
              <details>
                <summary style={{ 
                  cursor: 'pointer',
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  {anecdote.conversationContext?.messages[0]?.content || 'Anecdote'} ({new Date(anecdote.timestamp).toLocaleDateString()})
                </summary>
                <Box sx={{ 
                  ml: 2,
                  '& p': { my: 1 },
                  '& ul, & ol': { my: 1, pl: 3 },
                  '& li': { my: 0.5 },
                  '& code': {
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    fontFamily: 'monospace'
                  }
                }}>
                  <Markdown>{anecdote.content}</Markdown>
                </Box>
              </details>
            </Box>
          ))}
        </>
      )}
    </Box>
  )
} 