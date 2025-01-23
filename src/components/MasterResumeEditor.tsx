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

import React from 'react'
import { Box, IconButton, Typography, Button, Dialog } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { Resume, Experience, Anecdote } from '../types/Resume'
import { useResumeStore } from '../stores/useResumeStore'
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore'
import { EditableText } from './EditableText'
import { ResumeSection } from './ResumeSection'
import { ExperienceConversation } from './ExperienceConversation'

interface DeleteDialogState {
  type: 'experience'
  index: number
  title: string
}

const MasterResumeEditor = () => {
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteDialogState | null>(null)
  const { resume, updateResume } = useResumeStore()
  const { isOpen, experience, setOpen, setExperience } = useExperienceConversationStore()

  const handleUpdate = (updater: (resume: Resume) => Resume) => {
    if (resume) {
      const updated = updater(resume)
      updateResume(updated)
    }
  }

  const handleStartConversation = (exp: Experience) => {
    setExperience(exp)
    setOpen(true)
  }

  const handleCloseConversation = () => {
    setOpen(false)
  }

  const handleSaveAnecdote = (content: string) => {
    if (!experience) return

    const newAnecdote: Anecdote = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date().toISOString()
    }

    handleUpdate(r => ({
      ...r,
      experience: r.experience.map(exp => {
        if (exp === experience) {
          return {
            ...exp,
            anecdotes: [
              newAnecdote,
              ...(exp.anecdotes || [])
            ]
          }
        }
        return exp
      })
    }))

    setOpen(false)
  }

  return (
    <Box>
      {/* Main Resume Editor */}
      <Box sx={{ p: 2 }}>
        {resume?.experience.map((exp, index) => (
          <Box key={index} data-experience-item>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">{exp.company}</Typography>
              <IconButton 
                onClick={() => handleStartConversation(exp)}
                sx={{ ml: 1 }}
                title="Start conversation to enrich this experience"
              >
                <ChatIcon />
              </IconButton>
            </Box>

            <ResumeSection
              title="Description"
              content={exp.description}
              issues={[]}
              onRegenerate={async () => {}}
              onChange={(newContent) => {
                handleUpdate(r => ({
                  ...r,
                  experience: r.experience.map((e, i) => 
                    i === index ? { ...e, description: newContent } : e
                  )
                }))
              }}
              experience={exp}
              type="description"
            />

            {/* Display anecdotes if they exist */}
            {exp.anecdotes?.map((anecdote, i) => (
              <Box key={i} sx={{ ml: 2, mb: 2 }}>
                <EditableText
                  value={anecdote.content}
                  onChange={(newContent) => {
                    handleUpdate(r => ({
                      ...r,
                      experience: r.experience.map((e, eIndex) => 
                        eIndex === index ? {
                          ...e,
                          anecdotes: e.anecdotes?.map((a, aIndex) =>
                            aIndex === i ? { ...a, content: newContent } : a
                          )
                        } : e
                      )
                    }))
                  }}
                  multiline
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* Conversation Dialog */}
      <Dialog 
        open={isOpen} 
        onClose={handleCloseConversation}
        maxWidth="lg"
        fullWidth
      >
        {experience && (
          <ExperienceConversation
            experience={experience}
            onClose={handleCloseConversation}
          />
        )}
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteDialog}
        title={`Delete ${deleteDialog?.title}?`}
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={() => {
          if (deleteDialog) {
            handleUpdate((r: Resume) => ({
              ...r,
              experience: r.experience.filter((_, i: number) => i !== deleteDialog.index)
            }))
            setDeleteDialog(null)
          }
        }}
        onCancel={() => setDeleteDialog(null)}
      />
    </Box>
  )
}

export default MasterResumeEditor 