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
import { Box, IconButton, Typography, Button, Dialog, Collapse, Card, CardContent } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { Resume, Experience, Anecdote } from '../types/Resume'
import { useResumeStore } from '../stores/useResumeStore'
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore'
import { EditableText } from './EditableText'
import { EditableList } from './EditableList'
import { ResumeSection } from './ResumeSection'
import { ExperienceConversation } from './ExperienceConversation'
import AddIcon from '@mui/icons-material/Add'

interface DeleteDialogState {
  type: 'experience'
  index: number
  title: string
}

const MasterResumeEditor = () => {
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteDialogState | null>(null)
  const [expandedAnecdotes, setExpandedAnecdotes] = React.useState<Record<string, boolean>>({})
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

  const toggleAnecdotes = (expId: string) => {
    setExpandedAnecdotes(prev => ({
      ...prev,
      [expId]: !prev[expId]
    }))
  }

  return (
    <Box>
      {/* Main Resume Editor */}
      <Box sx={{ p: 2 }}>
        {resume?.experience.map((exp, index) => {
          const expId = exp.company + index // Simple ID for tracking expansion state
          const hasAnecdotes = exp.anecdotes && exp.anecdotes.length > 0
          const isExpanded = expandedAnecdotes[expId] || false

          return (
            <Card key={index} sx={{ mb: 3 }} data-experience-item>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{exp.company}</Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    <EditableText
                      value={exp.dates}
                      onChange={(newDates) => {
                        handleUpdate(r => ({
                          ...r,
                          experience: r.experience.map((e, i) => 
                            i === index ? { ...e, dates: newDates } : e
                          )
                        }))
                      }}
                    />
                  </Box>
                  <IconButton 
                    onClick={() => handleStartConversation(exp)}
                    sx={{ ml: 1 }}
                    title="Start conversation to enrich this experience"
                  >
                    <ChatIcon />
                  </IconButton>
                  {hasAnecdotes && (
                    <IconButton
                      onClick={() => toggleAnecdotes(expId)}
                      title={isExpanded ? "Collapse anecdotes" : "Expand anecdotes"}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
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

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Skills</Typography>
                <EditableList
                  title="Skills"
                  items={exp.skills}
                  onChange={(newSkills) => {
                    handleUpdate(r => ({
                      ...r,
                      experience: r.experience.map((e, i) => 
                        i === index ? { ...e, skills: newSkills } : e
                      )
                    }))
                  }}
                  collapsible={true}
                />

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Accomplishments</Typography>
                <EditableList
                  title="Accomplishments"
                  items={exp.accomplishments}
                  onChange={(newAccomplishments) => {
                    handleUpdate(r => ({
                      ...r,
                      experience: r.experience.map((e, i) => 
                        i === index ? { ...e, accomplishments: newAccomplishments } : e
                      )
                    }))
                  }}
                />

                {/* Display anecdotes if they exist */}
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Anecdotes</Typography>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <IconButton 
                      onClick={() => handleStartConversation(exp)}
                      size="small"
                      title="Add new anecdote"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {exp.anecdotes?.map((anecdote, i) => (
                    <Box key={i} sx={{ mb: 2 }}>
                      <details>
                        <summary style={{ 
                          cursor: 'pointer',
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem'
                        }}>
                          {anecdote.conversationContext?.messages[0]?.content || 'Anecdote'} ({new Date(anecdote.timestamp).toLocaleDateString()})
                        </summary>
                        <Box sx={{ ml: 2 }}>
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
                      </details>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )
        })}

        {/* Patents Section */}
        <Typography variant="h4" sx={{ mb: 3, mt: 4 }}>Patents</Typography>
        {resume?.patents?.map((patent, index) => (
          <Card key={index} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Patent #</Typography>
                <EditableText
                  value={patent.number}
                  onChange={(newNumber) => {
                    handleUpdate(r => ({
                      ...r,
                      patents: r.patents?.map((p, i) => 
                        i === index ? { ...p, number: newNumber } : p
                      )
                    }))
                  }}
                />
              </Box>
              <EditableText
                value={patent.title}
                onChange={(newTitle) => {
                  handleUpdate(r => ({
                    ...r,
                    patents: r.patents?.map((p, i) => 
                      i === index ? { ...p, title: newTitle } : p
                    )
                  }))
                }}
                multiline
              />
            </CardContent>
          </Card>
        ))}

        {/* Projects Section */}
        <Typography variant="h4" sx={{ mb: 3, mt: 4 }}>Projects</Typography>
        {resume?.projects?.map((project, index) => (
          <Card key={index} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{project.name}</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                  <EditableText
                    value={project.startDate || ''}
                    onChange={(newStartDate) => {
                      handleUpdate(r => ({
                        ...r,
                        projects: r.projects?.map((p, i) => 
                          i === index ? { ...p, startDate: newStartDate } : p
                        )
                      }))
                    }}
                  />
                  <Typography sx={{ mx: 1 }}>-</Typography>
                  <EditableText
                    value={project.endDate || ''}
                    onChange={(newEndDate) => {
                      handleUpdate(r => ({
                        ...r,
                        projects: r.projects?.map((p, i) => 
                          i === index ? { ...p, endDate: newEndDate } : p
                        )
                      }))
                    }}
                  />
                </Box>
                {project.url && (
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      {project.url}
                    </a>
                  </Typography>
                )}
              </Box>
              <EditableText
                value={project.description}
                onChange={(newContent) => {
                  handleUpdate(r => ({
                    ...r,
                    projects: r.projects?.map((p, i) => 
                      i === index ? { ...p, description: newContent } : p
                    )
                  }))
                }}
                multiline
              />
            </CardContent>
          </Card>
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