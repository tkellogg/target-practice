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
import { Box, Typography, CircularProgress, IconButton, useTheme, Dialog } from '@mui/material'
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
import { EditableSection } from '../components/EditableSection'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

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
      accomplishments: ['First accomplishment'],
      city: 'USA'
    }

    handleUpdate(r => ({
      ...r,
      experience: [...r.experience, newJob]
    }))

    // Scroll to the new item after a short delay to ensure it's rendered
    setTimeout(() => {
      const items = document.querySelectorAll('[data-experience-item]')
      const lastItem = items[items.length - 1]
      lastItem?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
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

  if (!resume) {
    return (
      <Box p={4}>
        <Typography color="error">
          {error || 'No resume loaded'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box p={4}>
      <MenuBar />

      <Box mb={4}>
        <Typography variant="h5" gutterBottom>Personal Information</Typography>
        <EditableText
          value={resume.personalInfo.name}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, name: value }
          }))}
          variant="h6"
        />
        <EditableText
          value={resume.personalInfo.address}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, address: value }
          }))}
        />
        <EditableText
          value={resume.personalInfo.phone}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, phone: value }
          }))}
        />
        <EditableText
          value={resume.personalInfo.email}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, email: value }
          }))}
        />
        <EditableText
          value={resume.personalInfo.description}
          onChange={(value) => handleUpdate(r => ({
            ...r,
            personalInfo: { ...r.personalInfo, description: value }
          }))}
          multiline
        />
      </Box>

      <Box mb={4}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }} data-section="experience">
          <Typography variant="h5">Experience</Typography>
          <IconButton onClick={addJob} size="small" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Box>

        {resume.experience.map((job, index) => (
          <Box 
            key={index} 
            mb={4} 
            data-experience-item
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
                <EditableText
                  value={job.city || 'USA'}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    experience: r.experience.map((j, i) => 
                      i === index ? { ...j, city: value } : j
                    )
                  }))}
                  variant="subtitle2"
                  sx={{ color: 'text.secondary' }}
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

            <EditableSection
              title=""
              description={job.description}
              skills={job.skills}
              accomplishments={job.accomplishments}
              onDescriptionChange={(value) => handleUpdate(r => ({
                ...r,
                experience: r.experience.map((j, i) => 
                  i === index ? { ...j, description: value } : j
                )
              }))}
              onSkillsChange={(value) => handleUpdate(r => ({
                ...r,
                experience: r.experience.map((j, i) => 
                  i === index ? { ...j, skills: value } : j
                )
              }))}
              onAccomplishmentsChange={(value) => handleUpdate(r => ({
                ...r,
                experience: r.experience.map((j, i) => 
                  i === index ? { ...j, accomplishments: value } : j
                )
              }))}
              experience={job}
            />
          </Box>
        ))}
        
        {resume.experience.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <IconButton
              onClick={() => {
                const experienceSection = document.querySelector('[data-section="experience"]')
                experienceSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
                }
              }}
            >
              <KeyboardArrowUpIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Projects section */}
      <Box mb={4}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Open Source Projects</Typography>
          <IconButton onClick={addProject} size="small" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Box>

        {resume.projects.map((project, index) => (
          <Box key={index} mb={2}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                <EditableText
                  value={project.url}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    projects: r.projects.map((p, i) => 
                      i === index ? { ...p, url: value } : p
                    )
                  }))}
                />
                <EditableText
                  value={project.description}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    projects: r.projects.map((p, i) => 
                      i === index ? { ...p, description: value } : p
                    )
                  }))}
                  multiline
                />
                <EditableText
                  value={project.technologies.join(', ')}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    projects: r.projects.map((p, i) => 
                      i === index ? { ...p, technologies: value.split(',').map(t => t.trim()) } : p
                    )
                  }))}
                />
              </Box>
              <IconButton onClick={() => handleDeleteProject(index)} size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Patents section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Patents</Typography>
          <IconButton onClick={addPatent} size="small" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Box>

        {resume.patents.map((patent, index) => (
          <Box key={index} mb={2}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <EditableText
                  value={patent.number}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    patents: r.patents.map((p, i) => 
                      i === index ? { ...p, number: value } : p
                    )
                  }))}
                />
                <EditableText
                  value={patent.title}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    patents: r.patents.map((p, i) => 
                      i === index ? { ...p, title: value } : p
                    )
                  }))}
                />
              </Box>
              <IconButton onClick={() => handleDeletePatent(index)} size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      {isOpen && currentExperience && (
        <Dialog
          open={isOpen}
          fullWidth
          maxWidth="lg"
          onClose={() => {
            useExperienceConversationStore.getState().reset();
          }}
          sx={{
            '& .MuiDialog-paper': {
              height: '80vh'
            }
          }}
        >
          <ExperienceConversation
            experience={currentExperience}
            onClose={() => {
              useExperienceConversationStore.getState().reset();
            }}
          />
        </Dialog>
      )}

      <DeleteConfirmDialog
        open={!!deleteDialog}
        title={`Delete ${deleteDialog?.title}`}
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </Box>
  )
} 