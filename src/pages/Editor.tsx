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

import React, { useState } from 'react'
import { Box, Typography, CircularProgress, IconButton, useTheme } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useResumeStore } from '../stores/useResumeStore'
import { EditableText } from '../components/EditableText'
import { MenuBar } from '../components/MenuBar'
import { Resume, Experience, Position } from '../types/Resume'
import ChatIcon from '@mui/icons-material/Chat'
import { ExperienceConversation } from '../components/ExperienceConversation'
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore'
import Markdown from 'markdown-to-jsx'
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog'

function isPosition(obj: any): obj is Position {
  return obj && 
    typeof obj.title === 'string' &&
    typeof obj.startDate === 'string' &&
    typeof obj.endDate === 'string'
}

function isExperience(obj: any): obj is Experience {
  return obj && 
    typeof obj.company === 'string' &&
    typeof obj.dates === 'string' &&
    Array.isArray(obj.positions) &&
    obj.positions.every(isPosition) &&
    Array.isArray(obj.skills) &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.accomplishments)
}

export const Editor = () => {
  const { resume, isLoading, error, updateResume } = useResumeStore()
  const { isOpen, currentExperience } = useExperienceConversationStore();
  const theme = useTheme()
  const [editingItem, setEditingItem] = useState<{
    type: 'skill' | 'accomplishment'
    jobIndex: number
    itemIndex: number
  } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'experience'
    index: number
    title: string
  } | null>(null)

  const handleUpdate = (updater: (resume: Resume) => Resume) => {
    if (resume) {
      const updated = updater(resume)
      updateResume(updated)
    }
  }

  const addJob = () => {
    const newJob: Experience = {
      company: 'New Company',
      dates: 'MONTH YEAR - PRESENT',
      positions: [{
        title: 'New Position',
        startDate: 'MONTH YEAR',
        endDate: 'PRESENT'
      }],
      skills: ['New Skill'],
      description: 'Description of role and responsibilities',
      accomplishments: ['First accomplishment']
    }

    handleUpdate(r => ({
      ...r,
      experience: [...r.experience, newJob]
    }))
  }

  const addProject = () => {
    handleUpdate(r => ({
      ...r,
      projects: [...r.projects, {
        name: 'New Project',
        url: 'https://',
        description: 'Project description',
        technologies: ['Technology']
      }]
    }))
  }

  const addPatent = () => {
    handleUpdate(r => ({
      ...r,
      patents: [...r.patents, {
        number: 'Patent Number',
        title: 'Patent Title'
      }]
    }))
  }

  const addAccomplishment = (jobIndex: number) => {
    handleUpdate(r => {
      const updatedExperience = r.experience.map((job, i) => {
        if (i === jobIndex && isExperience(job)) {
          return {
            ...job,
            accomplishments: [...job.accomplishments, 'New accomplishment']
          }
        }
        return job
      })
      return {
        ...r,
        experience: updatedExperience as Experience[]
      }
    })
    setEditingItem({
      type: 'accomplishment',
      jobIndex,
      itemIndex: resume!.experience[jobIndex].accomplishments.length
    })
  }

  const addSkill = (jobIndex: number) => {
    handleUpdate(r => {
      const updatedExperience = r.experience.map((job, i) => {
        if (i === jobIndex && isExperience(job)) {
          return {
            ...job,
            skills: [...job.skills, 'New skill']
          }
        }
        return job
      })
      return {
        ...r,
        experience: updatedExperience as Experience[]
      }
    })
    setEditingItem({
      type: 'skill',
      jobIndex,
      itemIndex: resume!.experience[jobIndex].skills.length
    })
  }

  const addPosition = (jobIndex: number) => {
    const newPosition: Position = {
      title: 'New Position',
      startDate: 'MONTH YEAR',
      endDate: 'PRESENT'
    }

    handleUpdate(r => {
      const updatedExperience = r.experience.map((job, i) => {
        if (i === jobIndex && isExperience(job)) {
          return {
            ...job,
            positions: [...job.positions, newPosition]
          }
        }
        return job
      })
      return {
        ...r,
        experience: updatedExperience as Experience[]
      }
    })
  }

  const handleDeleteExperience = (index: number) => {
    setDeleteDialog({
      type: 'experience',
      index,
      title: resume!.experience[index].company
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteDialog) return

    if (deleteDialog.type === 'experience') {
      handleUpdate(r => ({
        ...r,
        experience: r.experience.filter((_, i) => i !== deleteDialog.index)
      }))
    }

    setDeleteDialog(null)
  }

  const handleDeleteAccomplishment = (jobIndex: number, accIndex: number) => {
    handleUpdate(r => ({
      ...r,
      experience: r.experience.map((job, i) => 
        i === jobIndex ? {
          ...job,
          accomplishments: job.accomplishments.filter((_, j) => j !== accIndex)
        } : job
      )
    }))
  }

  const handleDeleteSkill = (jobIndex: number, skillIndex: number) => {
    handleUpdate(r => ({
      ...r,
      experience: r.experience.map((job, i) => 
        i === jobIndex ? {
          ...job,
          skills: job.skills.filter((_, j) => j !== skillIndex)
        } : job
      )
    }))
  }

  const handleDeleteProject = (index: number) => {
    handleUpdate(r => ({
      ...r,
      projects: r.projects.filter((_, i) => i !== index)
    }))
  }

  const handleDeletePatent = (index: number) => {
    handleUpdate(r => ({
      ...r,
      patents: r.patents.filter((_, i) => i !== index)
    }))
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  if (!resume) {
    return (
      <Box p={4}>
        <Typography>Select a repository to load your resume</Typography>
      </Box>
    )
  }

  return (
    <>
      <MenuBar />
      <Box p={4}>
        <EditableText
          value={resume.personalInfo.name}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, name: value }
          }))}
          variant="h4"
          sx={{ mb: 2 }}
        />
        <EditableText
          value={resume.personalInfo.address}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, address: value }
          }))}
          variant="body1"
        />
        <EditableText
          value={`${resume.personalInfo.phone} | ${resume.personalInfo.email}`}
          onChange={(value) => {
            const [phone, email] = value.split('|').map(s => s.trim())
            handleUpdate(r => ({
              ...r,
              personalInfo: { ...r.personalInfo, phone, email }
            }))
          }}
          variant="body1"
        />
        <EditableText
          value={resume.personalInfo.description}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, description: value }
          }))}
          variant="body1"
          multiline
          sx={{ mt: 2 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h5">Experience</Typography>
          <IconButton onClick={addJob} size="small" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Box>
        {resume.experience.map((job, index) => (
          <Box 
            key={index} 
            mb={4} 
            sx={{ 
              p: 2,
              pt: 5,
              borderRadius: '2px',
              bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative'
            }}
          >
            <IconButton 
              onClick={() => handleDeleteExperience(index)}
              size="small"
              sx={{
                position: 'absolute',
                top: -12,
                right: 8,
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <EditableText
                  value={job.company}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    experience: r.experience.map((j, i) => 
                      i === index ? { ...j, company: value } : j
                    )
                  }))}
                  variant="h6"
                />
                <EditableText
                  value={job.dates}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    experience: r.experience.map((j, i) => 
                      i === index ? { ...j, dates: value } : j
                    )
                  }))}
                  variant="subtitle1"
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EditableText
                value={job.positions.map(pos => pos.title).join(' → ')}
                onChange={(value) => handleUpdate(r => ({
                  ...r,
                  experience: r.experience.map((j, i) => {
                    if (i === index) {
                      const titles = value.split(' → ')
                      const updatedPositions = titles.map((title, idx) => {
                        const oldPos = j.positions[idx]
                        return oldPos
                          ? { ...oldPos, title }
                          : { title, startDate: '', endDate: '' }
                      })
                      return { ...j, positions: updatedPositions }
                    }
                    return j
                  })
                }))}
                variant="subtitle2"
                sx={{ mt: 1, flexGrow: 1 }}
              />
              <IconButton onClick={() => addPosition(index)} size="small">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            <EditableText
              value={job.description}
              onChange={(value) => handleUpdate(r => ({
                ...r,
                experience: r.experience.map((j, i) => 
                  i === index ? { ...j, description: value } : j
                )
              }))}
              variant="body1"
              multiline
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2">Skills:</Typography>
              <IconButton onClick={() => addSkill(index)} size="small" sx={{ ml: 1 }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            {job.skills.map((skill, skillIndex) => (
              <EditableText
                key={skillIndex}
                value={skill}
                onChange={(value) => {
                  handleUpdate(r => ({
                    ...r,
                    experience: r.experience.map((j, i) => 
                      i === index ? {
                        ...j,
                        skills: j.skills.map((s, si) => si === skillIndex ? value : s)
                      } : j
                    )
                  }))
                  setEditingItem(null)
                }}
                variant="body2"
                onDelete={() => handleDeleteSkill(index, skillIndex)}
                forceEdit={editingItem?.type === 'skill' && 
                          editingItem.jobIndex === index && 
                          editingItem.itemIndex === skillIndex}
              />
            ))}

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2">Accomplishments:</Typography>
              <IconButton onClick={() => addAccomplishment(index)} size="small" sx={{ ml: 1 }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            <ul>
              {job.accomplishments.map((item, accIndex) => (
                <li key={accIndex}>
                  <EditableText
                    value={item}
                    onChange={(value) => {
                      handleUpdate(r => ({
                        ...r,
                        experience: r.experience.map((j, jobIndex) => 
                          jobIndex === index ? {
                            ...j,
                            accomplishments: j.accomplishments.map((a, ai) =>
                              ai === accIndex ? value : a
                            )
                          } : j
                        )
                      }))
                      setEditingItem(null)
                    }}
                    variant="body2"
                    onDelete={() => handleDeleteAccomplishment(index, accIndex)}
                    forceEdit={editingItem?.type === 'accomplishment' && 
                              editingItem.jobIndex === index && 
                              editingItem.itemIndex === accIndex}
                  />
                </li>
              ))}
            </ul>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="subtitle2">Anecdotes:</Typography>
              <IconButton 
                onClick={() => {
                  useExperienceConversationStore.getState().setExperience(job);
                  useExperienceConversationStore.getState().setOpen(true);
                }} 
                size="small" 
                sx={{ ml: 1 }}
              >
                <ChatIcon fontSize="small" />
              </IconButton>
            </Box>
            {job.anecdotes?.map((anecdote, i) => (
              <Box key={anecdote.id} sx={{ mt: 1 }}>
                <details>
                  <summary style={{ 
                    cursor: 'pointer',
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <span style={{ flex: 1 }}>
                      {anecdote.conversationContext?.messages[0]?.content || 'Anecdote'} ({new Date(anecdote.timestamp).toLocaleDateString()})
                    </span>
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.preventDefault(); // Prevent details from toggling
                        useExperienceConversationStore.getState().setExperience(job);
                        useExperienceConversationStore.getState().setMessages(anecdote.conversationContext?.messages || []);
                        useExperienceConversationStore.getState().setOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.preventDefault(); // Prevent details from toggling
                        handleUpdate(r => ({
                          ...r,
                          experience: r.experience.map((j, jobIndex) => 
                            j.company === job.company ? {
                              ...j,
                              anecdotes: (j.anecdotes || []).filter(a => a.id !== anecdote.id)
                            } : j
                          )
                        }));
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
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
          </Box>
        ))}

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h5">Projects</Typography>
          <IconButton onClick={addProject} size="small" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Box>
        {resume.projects.map((project, index) => (
          <Box 
            key={index} 
            mb={2}
            sx={{ 
              p: 2,
              borderRadius: '2px',
              bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <EditableText
                  value={project.name}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    projects: r.projects.map((p, i) => 
                      i === index ? { ...p, name: value } : p
                    )
                  }))}
                  variant="h6"
                />
              </Box>
              <IconButton 
                onClick={() => handleDeleteProject(index)}
                size="small"
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 1 },
                  [`${Box}:hover &`]: { opacity: 1 }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <EditableText
              value={project.url}
              onChange={(value) => handleUpdate(r => ({
                ...r,
                projects: r.projects.map((p, i) => 
                  i === index ? { ...p, url: value } : p
                )
              }))}
              variant="body2"
            />
            <EditableText
              value={project.description}
              onChange={(value) => handleUpdate(r => ({
                ...r,
                projects: r.projects.map((p, i) => 
                  i === index ? { ...p, description: value } : p
                )
              }))}
              variant="body1"
              multiline
            />
            <EditableText
              value={project.technologies.join(', ')}
              onChange={(value) => handleUpdate(r => ({
                ...r,
                projects: r.projects.map((p, i) => 
                  i === index ? { ...p, technologies: value.split(', ').map(t => t.trim()) } : p
                )
              }))}
              variant="body2"
            />
          </Box>
        ))}

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h5">Patents</Typography>
          <IconButton onClick={addPatent} size="small" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Box>
        {resume.patents.map((patent, index) => (
          <Box 
            key={index} 
            mb={2}
            sx={{ 
              p: 2,
              borderRadius: '2px',
              bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <EditableText
                  value={`${patent.number} - ${patent.title}`}
                  onChange={(value) => {
                    const [number, ...titleParts] = value.split(' - ')
                    const title = titleParts.join(' - ')
                    handleUpdate(r => ({
                      ...r,
                      patents: r.patents.map((p, i) => 
                        i === index ? { number, title } : p
                      )
                    }))
                  }}
                  variant="subtitle1"
                />
              </Box>
              <IconButton 
                onClick={() => handleDeletePatent(index)}
                size="small"
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 1 },
                  [`${Box}:hover &`]: { opacity: 1 }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      <DeleteConfirmDialog
        open={deleteDialog !== null}
        title={`Delete ${deleteDialog?.title}?`}
        message="This will permanently delete this experience and all its details, including skills, accomplishments, and anecdotes."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />

      {isOpen && currentExperience && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'background.paper',
            zIndex: 1200
          }}
        >
          <ExperienceConversation
            experience={currentExperience}
            onClose={() => useExperienceConversationStore.getState().setOpen(false)}
          />
        </Box>
      )}
    </>
  )
} 