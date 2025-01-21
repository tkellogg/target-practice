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
import { Box, Typography, CircularProgress, IconButton, useTheme, Dialog, Container, Button, Paper, Step, StepLabel, Stepper, TextField, List, ListItem, ListItemText, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import { useResumeStore } from '../stores/useResumeStore'
import { EditableText } from '../components/EditableText'
import { MenuBar } from '../components/MenuBar'
import { Resume, Experience, Position } from '../types/Resume'
import { JobPosting, JobAnalysis } from '../types/JobPosting'
import ChatIcon from '@mui/icons-material/Chat'
import { ExperienceConversation } from '../components/ExperienceConversation'
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore'
import Markdown from 'markdown-to-jsx'
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog'
import { EditableSection } from '../components/EditableSection'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { ProjectConversation } from '../components/ProjectConversation'
import { analyzeJobPostingPrompt } from '../utils/prompts'
import { callAnthropicAPI } from '../utils/anthropic'
import { JobPostingReview } from '../components/JobPostingReview'
import { JobAnalysis as JobAnalysisComponent } from '../components/JobAnalysis'
import { JobAnalysis as JobAnalysisType } from '../types/JobPosting'
import { ResumePreview } from '../components/ResumePreview'

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

const steps = ['Review Posting', 'Analyze', 'Generate']

export const Editor = () => {
  const { resume, isLoading, error, updateResume } = useResumeStore()
  const { isOpen, experience, project } = useExperienceConversationStore()
  const theme = useTheme()
  const [activeStep, setActiveStep] = useState(0)
  const [jobPosting, setJobPosting] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null)
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

  const handleAnalyzePosting = async () => {
    if (!jobPosting.trim()) return
    
    setAnalyzing(true)
    try {
      const posting: JobPosting = {
        id: crypto.randomUUID(),
        company: '',  // Will be extracted by AI
        title: '',   // Will be extracted by AI
        url: '',     // Not needed for analysis
        rawText: jobPosting
      }
      console.log('Analyzing job posting:')
      const prompt = analyzeJobPostingPrompt(posting)
      const response = await callAnthropicAPI(prompt)
      // Extract JSON from the response
      const json = JSON.parse(response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1))
      setAnalysis(json)
      console.log('Analysis:', json)
      setActiveStep(1);
    } catch (error) {
      console.error('Failed to analyze job posting:', error)
      // TODO: Show error message to user
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGeneratePreview = () => {
    if (!analysis) return
    setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1))
  }

  const handleRegenerateResume = () => {
    // TODO: Implement resume regeneration
    console.log('Regenerating resume...')
  }

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0))
  }

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
        technologies: ['New Technology'],
        skills: ['New Skill'],
        accomplishments: ['First accomplishment'],
        startDate: 'MONTH YEAR',
        endDate: 'PRESENT',
        anecdotes: []
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
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <JobPostingReview 
            jobPosting={jobPosting}
            onJobPostingChange={setJobPosting}
          />
        )
      case 1:
        return (
          <JobAnalysisComponent
            analyzing={analyzing}
            analysis={analysis}
          />
        )
      case 2:
        return (
          <ResumePreview
            resume={resume}
          />
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <MenuBar />
      
      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Container maxWidth="lg">
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}
        </Container>
      </Box>

      {/* Bottom navigation bar */}
      <Paper 
        elevation={3} 
        sx={{ 
          py: 2, 
          px: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        {/* Left side: Action buttons */}
        <Box>
          {activeStep === 0 && (
            <Button 
              variant="contained" 
              onClick={handleAnalyzePosting}
              disabled={!jobPosting.trim() || analyzing}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Posting'}
            </Button>
          )}
          {activeStep === 1 && (
            <Button 
              variant="contained" 
              onClick={handleGeneratePreview}
              disabled={!analysis}
            >
              Generate Preview
            </Button>
          )}
          {activeStep === 2 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleRegenerateResume}
            >
              Regenerate
            </Button>
          )}
        </Box>

        {/* Right side: Navigation buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<NavigateBeforeIcon />}
          >
            Previous
          </Button>
          <Button
            onClick={() => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))}
            disabled={
              activeStep === steps.length - 1 || 
              (activeStep === 0 && !analysis) ||
              (activeStep === 1 && !analysis)
            }
            endIcon={<NavigateNextIcon />}
            variant="contained"
          >
            Next
          </Button>
        </Box>
      </Paper>

      {/* Dialogs */}
      <Dialog
        open={isOpen}
        onClose={() => useExperienceConversationStore.getState().setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {experience && (
          <ExperienceConversation
            experience={experience}
            onClose={() => useExperienceConversationStore.getState().setOpen(false)}
          />
        )}
        {project && (
          <ProjectConversation
            project={project}
            onClose={() => useExperienceConversationStore.getState().setOpen(false)}
          />
        )}
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteDialog}
        title={`Delete ${deleteDialog?.title}?`}
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={() => {
          if (deleteDialog) {
            handleUpdate(r => ({
              ...r,
              experience: r.experience.filter((_, i) => i !== deleteDialog.index)
            }))
            setDeleteDialog(null)
          }
        }}
        onCancel={() => setDeleteDialog(null)}
      />
    </Box>
  )
} 