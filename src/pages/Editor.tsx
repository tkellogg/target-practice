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

import { Box, Typography, CircularProgress, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useResumeStore } from '../stores/useResumeStore'
import { EditableText } from '../components/EditableText'
import { MenuBar } from '../components/MenuBar'
import { Resume, Experience, Position } from '../types/Resume'
import ChatIcon from '@mui/icons-material/Chat'
import { ExperienceConversation } from '../components/ExperienceConversation'
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore'

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
      anecdotes: []
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
          <Box key={index} mb={4}>
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
            <EditableText
              value={job.skills.join(', ')}
              onChange={(value) => handleUpdate(r => ({
                ...r,
                experience: r.experience.map((j, i) => 
                  i === index ? { ...j, skills: value.split(', ').map(s => s.trim()) } : j
                )
              }))}
              variant="body2"
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2">Accomplishments:</Typography>
              <IconButton onClick={() => addAccomplishment(index)} size="small" sx={{ ml: 1 }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            <ul>
              {job.accomplishments.map((item, i) => (
                <li key={i}>
                  <EditableText
                    value={item}
                    onChange={(value) => handleUpdate(r => ({
                      ...r,
                      experience: r.experience.map((j, jobIndex) => 
                        jobIndex === index ? {
                          ...j,
                          accomplishments: j.accomplishments.map((a, accIndex) =>
                            accIndex === i ? value : a
                          )
                        } : j
                      )
                    }))}
                    variant="body2"
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
                <EditableText
                  value={anecdote.content}
                  onChange={(value) => handleUpdate(r => ({
                    ...r,
                    experience: r.experience.map((j, jobIndex) => 
                      jobIndex === index ? {
                        ...j,
                        anecdotes: j.anecdotes?.map((a, anecdoteIndex) =>
                          anecdoteIndex === i ? { ...a, content: value } : a
                        )
                      } : j
                    )
                  }))}
                  variant="body2"
                  multiline
                />
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
          <Box key={index} mb={3}>
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
          <Box key={index} mb={2}>
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
        ))}
      </Box>
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