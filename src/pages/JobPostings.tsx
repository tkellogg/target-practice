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

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Link
} from '@mui/material'
import { useJobPostingStore } from '../stores/useJobPostingStore'
import { callAnthropicAPI } from '../utils/api'
import { EditableList } from '../components/EditableList'
import { useResume } from '../hooks/useResume'

const steps = [
  'Paste Job Description',
  'Analyze Needs',
  'Generate & Review Resume',
  'Export'
]

export const JobPostings = () => {
  const {
    postings,
    selectedPosting,
    selectedRepo,
    isLoading: isLoadingPosting,
    error: postingError,
    loadPostings,
    createPosting,
    updatePosting,
    setSelectedPosting,
    analyzePosting,
    generateResume,
    updateRequirements,
    updateSuccessCriteria,
    exportToPDF
  } = useJobPostingStore()

  const { resume, isLoading: isLoadingResume, error: resumeError } = useResume(selectedRepo)

  const [activeStep, setActiveStep] = useState(0)
  const [newPosting, setNewPosting] = useState({
    company: '',
    title: '',
    url: '',
    rawText: ''
  })
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    loadPostings()
  }, [])

  const handleNext = () => {
    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleCreate = async () => {
    if (!newPosting.rawText) return
    
    try {
      const prompt = `Extract the company name and job title from this job posting. Return as JSON with "company" and "title" fields.

Job Posting:
${newPosting.rawText}`

      const extracted = await callAnthropicAPI(prompt)
      
      // Use extracted values as defaults if fields are empty
      const company = newPosting.company || extracted.company
      const title = newPosting.title || extracted.title
      
      await createPosting(company, title, newPosting.url, newPosting.rawText)
      handleNext()
    } catch (error) {
      console.error('Failed to analyze job posting:', error)
    }
  }

  const handleUpdateRawText = async (text: string) => {
    if (selectedPosting) {
      await updatePosting({ ...selectedPosting, rawText: text })
    }
  }

  const handleAnalyze = async () => {
    if (selectedPosting) {
      await analyzePosting(selectedPosting)
      handleNext()
    }
  }

  const handleGenerate = async () => {
    if (selectedPosting) {
      await generateResume(selectedPosting)
      handleNext()
    }
  }

  const handleExport = async () => {
    if (!selectedPosting?.generatedResume || !selectedRepo) return
    
    try {
      const path = await exportToPDF(selectedPosting)
      console.log('PDF exported successfully:', path)
      
      // Get the file metadata from GitHub API
      const [owner, repo] = selectedRepo.split('/')
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `token ${import.meta.env.VITE_GH_ACCESS_KEY}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to get file metadata from GitHub')
      }
      
      const data = await response.json()
      setPdfUrl(data.download_url)
    } catch (error) {
      console.error('Failed to export PDF:', error)
    }
  }

  const renderResume = () => {
    if (!selectedPosting?.generatedResume || !resume) return null

    const [overview, closing] = selectedPosting.generatedResume.split('\n\n')

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{resume.personalInfo.name}</Typography>
        <Typography paragraph>{resume.personalInfo.address}</Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Overview</Typography>
        <Typography paragraph>{overview}</Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Experience</Typography>
        {resume.experience.map((job, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Typography variant="h6">{job.company}</Typography>
            {job.positions.map((pos, j) => (
              <Typography key={j} variant="subtitle1">
                {pos.title} ({pos.startDate} - {pos.endDate})
              </Typography>
            ))}
            <Typography paragraph>{job.description}</Typography>
            <List dense>
              {job.accomplishments.map((acc, k) => (
                <ListItem key={k}>
                  <ListItemText primary={`• ${acc}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Open Source Projects</Typography>
        {resume.projects.map((project, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Typography variant="h6">
              {project.name}
              {project.url && (
                <Link href={project.url} target="_blank" sx={{ ml: 1 }}>
                  {project.url}
                </Link>
              )}
            </Typography>
            <Typography paragraph>{project.description}</Typography>
            <Typography variant="body2" color="text.secondary">
              Technologies: {project.technologies.join(', ')}
            </Typography>
          </Box>
        ))}

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Patents</Typography>
        <List dense>
          {resume.patents.map((patent, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={patent.title}
                secondary={`Patent #${patent.number}`}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Closing</Typography>
        <Typography paragraph>{closing}</Typography>
      </Paper>
    )
  }

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>New Job Posting</Typography>
              <TextField
                fullWidth
                multiline
                minRows={10}
                value={newPosting.rawText || ''}
                onChange={(e) => setNewPosting(prev => ({ ...prev, rawText: e.target.value }))}
                placeholder="Paste the full job posting text here..."
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Company"
                value={newPosting.company}
                onChange={(e) => setNewPosting(prev => ({ ...prev, company: e.target.value }))}
                margin="normal"
                helperText="Leave blank to extract automatically"
              />
              <TextField
                fullWidth
                label="Position Title"
                value={newPosting.title}
                onChange={(e) => setNewPosting(prev => ({ ...prev, title: e.target.value }))}
                margin="normal"
                helperText="Leave blank to extract automatically"
              />
              <TextField
                fullWidth
                label="Job URL"
                value={newPosting.url}
                onChange={(e) => setNewPosting(prev => ({ ...prev, url: e.target.value }))}
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={!newPosting.rawText}
                sx={{ mt: 2 }}
              >
                Create & Analyze
              </Button>
            </Box>
            
            <Typography variant="h6" gutterBottom>Existing Postings</Typography>
            <List>
              {postings.map(posting => (
                <ListItemButton
                  key={posting.id}
                  selected={selectedPosting?.id === posting.id}
                  onClick={() => {
                    setSelectedPosting(posting)
                    setActiveStep(posting.analysis ? 2 : 1)
                  }}
                >
                  <ListItemText
                    primary={`${posting.company} - ${posting.title}`}
                    secondary={posting.url}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Paste Job Description</Typography>
            <TextField
              fullWidth
              multiline
              minRows={10}
              value={selectedPosting?.rawText || ''}
              onChange={(e) => handleUpdateRawText(e.target.value)}
              placeholder="Paste the full job posting text here..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!selectedPosting?.rawText}
            >
              Analyze
            </Button>
          </Box>
        )

      case 2:
        return (
          <Box>
            {selectedPosting?.analysis && (
              <>
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Analysis</Typography>
                  <Typography variant="subtitle1">Role Description</Typography>
                  <Typography paragraph>{selectedPosting.analysis.roleDescription}</Typography>
                  
                  <Typography variant="subtitle1">Company Description</Typography>
                  <Typography paragraph>{selectedPosting.analysis.companyDescription}</Typography>
                  
                  <Typography variant="h6" gutterBottom>Required Skills</Typography>
                  <EditableList
                    items={selectedPosting.analysis.requiredSkills}
                    onChange={(items) => updateRequirements(selectedPosting, 'required', items)}
                    title="required skill"
                  />

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Optional Skills</Typography>
                  <EditableList
                    items={selectedPosting.analysis.optionalSkills}
                    onChange={(items) => updateRequirements(selectedPosting, 'optional', items)}
                    title="optional skill"
                  />

                  <Typography variant="h6" sx={{ mt: 3 }}>Success Criteria</Typography>
                  <EditableList
                    items={selectedPosting.analysis.successCriteria}
                    title="success criteria"
                    onChange={(items) => updateSuccessCriteria(selectedPosting, items)}
                  />
                </Paper>

                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={!selectedPosting.analysis}
                >
                  Generate Resume
                </Button>
              </>
            )}
          </Box>
        )

      case 3:
        return (
          <Box>
            {(isLoadingPosting || isLoadingResume) ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : postingError || resumeError ? (
              <Box p={4}>
                <Typography color="error">{postingError || resumeError}</Typography>
              </Box>
            ) : selectedPosting?.generatedResume && (
              <>
                {renderResume()}

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleExport}
                    disabled={isLoadingPosting}
                  >
                    {isLoadingPosting ? 'Exporting...' : 'Export to PDF'}
                  </Button>
                  
                  {pdfUrl && (
                    <Button
                      variant="outlined"
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Box>
        )
    }
  }

  if (isLoadingPosting || isLoadingResume) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (postingError || resumeError) {
    return (
      <Box p={4}>
        <Typography color="error">{postingError || resumeError}</Typography>
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStep()}

      <Box sx={{ display: 'flex', mt: 4 }}>
        <Button
          variant="outlined"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
      </Box>
    </Box>
  )
} 