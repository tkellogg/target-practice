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
import { extractJobInfoPrompt } from '../utils/prompts'
import { EditableList } from '../components/EditableList'
import { useResume } from '../hooks/useResume'
import { SuggestionBadge } from '../components/SuggestionBadge'
import { SplitView } from '../components/SplitView'
import { JobRequirements } from '../components/JobRequirements'

interface ExtractedData {
  company: string
  title: string
}

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
    generateSuggestions,
    updateRequirements,
    updateSuccessCriteria,
    exportToPDF,
    regenerateSection
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

  // Helper function to normalize company names for matching
  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  // Helper function to find suggestions for a company
  const findCompanySuggestions = (companyName: string, suggestions?: Record<string, any>) => {
    if (!suggestions) {
      console.log('No suggestions provided for company:', companyName)
      return null
    }
    
    const normalizedName = normalizeCompanyName(companyName)
    console.log('Looking for suggestions:', {
      originalName: companyName,
      normalizedName,
      availableKeys: Object.keys(suggestions),
      normalizedKeys: Object.keys(suggestions).map(k => normalizeCompanyName(k))
    })
    
    const entry = Object.entries(suggestions).find(([key]) => {
      const normalizedKey = normalizeCompanyName(key)
      const matches = normalizedKey === normalizedName
      console.log('Comparing:', {
        key,
        normalizedKey,
        matches,
        withName: normalizedName
      })
      return matches
    })
    
    if (entry) {
      console.log('Found suggestions for company:', {
        company: companyName,
        suggestionCount: entry[1].length,
        suggestions: entry[1]
      })
    } else {
      console.log('No suggestions found for company:', {
        company: companyName,
        normalizedName,
        availableCompanies: Object.keys(suggestions)
      })
    }
    
    return entry ? suggestions[entry[0]] : null
  }

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
      const prompt = extractJobInfoPrompt(newPosting.rawText)
      const response = await callAnthropicAPI(prompt)
      const text = typeof response.content === 'string' 
        ? response.content 
        : response.content[0]?.text || ''
      const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
      const extracted = JSON.parse(jsonText) as ExtractedData
      
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
    if (!selectedPosting || !resume) {
      console.error('Missing required data:', { hasPosting: !!selectedPosting, hasResume: !!resume })
      return
    }
    
    try {
      console.log('Starting resume generation...')
      await generateResume(selectedPosting, resume)
      console.log('Resume generated, generating suggestions...')
      await generateSuggestions(selectedPosting)
    } catch (error) {
      console.error('Failed to generate:', error)
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
    console.log('Rendering resume with posting:', selectedPosting);
    if (!selectedPosting?.generatedResume || !resume) {
      console.log('Missing data:', {
        hasPosting: !!selectedPosting,
        hasGeneratedResume: !!selectedPosting?.generatedResume,
        hasResume: !!resume
      });
      return null;
    }

    // Split resume into sections
    const sections = selectedPosting.generatedResume.split(/\n\s*\n/)
    const overview = sections[0] || ''
    const summary = sections[1] || ''
    const remaining = sections.slice(2).join('\n\n')

    return (
      <Box sx={{ height: '100%' }}>
        <Typography variant="h4" gutterBottom>{resume.personalInfo.name}</Typography>
        <Typography paragraph>{resume.personalInfo.address}</Typography>

        {/* Overview Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h5">Overview</Typography>
          {selectedPosting?.suggestions ? (
            <SuggestionBadge 
              suggestions={selectedPosting.suggestions.overview}
              onApply={(feedback, acceptedSuggestions) => {
                console.log('Applying suggestions to overview:', {feedback, acceptedSuggestions})
                regenerateSection(selectedPosting, 'overview', null, feedback, acceptedSuggestions)
              }}
            />
          ) : null}
        </Box>
        <Typography paragraph>{overview}</Typography>

        {/* Experience Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h5">Experience</Typography>
        </Box>
        {resume.experience.map((job, i) => {
          console.log('\nProcessing job:', job.company)
          console.log('Available suggestions:', selectedPosting?.suggestions?.experience)
          const companySuggestions = findCompanySuggestions(job.company, selectedPosting?.suggestions?.experience)
          console.log('Final suggestion result:', {
            company: job.company,
            hasSuggestions: !!companySuggestions,
            suggestionCount: companySuggestions?.length
          })
          return (
            <Box key={i} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{job.company}</Typography>
                {companySuggestions && (
                  <SuggestionBadge 
                    suggestions={companySuggestions}
                    onApply={(feedback, acceptedSuggestions) => {
                      regenerateSection(selectedPosting, 'experience', job.company, feedback, acceptedSuggestions)
                    }}
                  />
                )}
              </Box>
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
          )
        })}

        {/* Open Source Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h5">Open Source Projects</Typography>
        </Box>
        {resume.projects.map((project, i) => (
          <Box key={i} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">
                {project.name}
                {project.url && (
                  <Link href={project.url} target="_blank" sx={{ ml: 1 }}>
                    {project.url}
                  </Link>
                )}
              </Typography>
              {selectedPosting?.suggestions?.openSource[project.name] && (
                <SuggestionBadge 
                  suggestions={selectedPosting.suggestions.openSource[project.name]}
                  onApply={(feedback, acceptedSuggestions) => {
                    regenerateSection(selectedPosting, 'openSource', project.name, feedback, acceptedSuggestions)
                  }}
                />
              )}
            </Box>
            <Typography paragraph>{project.description}</Typography>
            <Typography variant="body2" color="text.secondary">
              Technologies: {project.technologies.join(', ')}
            </Typography>
          </Box>
        ))}

        {/* Summary Section (moved to end) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 4 }}>
          <Typography variant="h5">Summary</Typography>
          {selectedPosting?.suggestions ? (
            <SuggestionBadge 
              suggestions={selectedPosting.suggestions.summary}
              onApply={(feedback, acceptedSuggestions) => {
                regenerateSection(selectedPosting, 'summary', null, feedback, acceptedSuggestions)
              }}
            />
          ) : null}
        </Box>
        <Typography paragraph>{summary}</Typography>
      </Box>
    )
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={10}
              label="Job Description"
              value={selectedPosting?.rawText || newPosting.rawText}
              onChange={(e) => {
                if (selectedPosting) {
                  handleUpdateRawText(e.target.value)
                } else {
                  setNewPosting({ ...newPosting, rawText: e.target.value })
                }
              }}
            />
          </Box>
        )
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            {selectedPosting?.analysis && (
              <JobRequirements
                analysis={selectedPosting.analysis}
                onUpdateRequirements={(type, requirements) => {
                  if (selectedPosting) {
                    updateRequirements(selectedPosting, type, requirements)
                  }
                }}
                onUpdateSuccessCriteria={(criteria) => {
                  if (selectedPosting) {
                    updateSuccessCriteria(selectedPosting, criteria)
                  }
                }}
                isEditable
              />
            )}
          </Box>
        )
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <SplitView
              leftTitle="Job Requirements"
              rightTitle="Generated Resume"
              leftContent={
                <JobRequirements
                  analysis={selectedPosting?.analysis || null}
                  isEditable={false}
                />
              }
              rightContent={renderResume()}
              leftWidth={40}
            />
          </Box>
        )
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            {pdfUrl ? (
              <Link href={pdfUrl} target="_blank" rel="noopener">
                Download PDF
              </Link>
            ) : (
              <Typography>Click Export to generate PDF</Typography>
            )}
          </Box>
        )
      default:
        return null
    }
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
                    console.log('Selected posting:', posting);
                    console.log('Setting active step to:', posting.analysis ? 2 : 1);
                    setSelectedPosting(posting);
                    setActiveStep(posting.generatedResume ? 3 : (posting.analysis ? 2 : 1));
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
                  <Typography variant="h6" gutterBottom>Job Requirements Analysis</Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1">Role Description</Typography>
                    <Typography paragraph>{selectedPosting.analysis.roleDescription}</Typography>
                    
                    <Typography variant="subtitle1">Company Description</Typography>
                    <Typography paragraph>{selectedPosting.analysis.companyDescription}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>Required Skills</Typography>
                      <EditableList
                        items={selectedPosting.analysis.requiredSkills}
                        onChange={(items) => updateRequirements(selectedPosting, 'required', items)}
                        title="required skill"
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>Optional Skills</Typography>
                      <EditableList
                        items={selectedPosting.analysis.optionalSkills}
                        onChange={(items) => updateRequirements(selectedPosting, 'optional', items)}
                        title="optional skill"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6">Success Criteria</Typography>
                    <EditableList
                      items={selectedPosting.analysis.successCriteria}
                      title="success criteria"
                      onChange={(items) => updateSuccessCriteria(selectedPosting, items)}
                    />
                  </Box>
                </Paper>

                {selectedPosting.generatedResume ? (
                  <>
                    {renderResume()}
                    <Button
                      variant="contained"
                      onClick={handleGenerate}
                      sx={{ mr: 2 }}
                    >
                      Regenerate Resume
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setActiveStep(3)}
                    >
                      Proceed to Export
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleGenerate}
                  >
                    Generate Resume
                  </Button>
                )}
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
            ) : selectedPosting?.generatedResume ? (
              <>
                {console.log('About to render resume with:', {
                  selectedPosting,
                  resume,
                  generatedResume: selectedPosting.generatedResume
                })}
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
            ) : (
              <>
                {console.log('No resume to render:', {
                  hasPosting: !!selectedPosting,
                  hasGeneratedResume: !!selectedPosting?.generatedResume,
                  hasResume: !!resume
                })}
                <Typography>
                  No generated resume available
                </Typography>
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
        {steps.map((label, index) => {
          const isClickable = index === 0 || 
            (index === 1 && selectedPosting) ||
            (index === 2 && selectedPosting?.analysis) ||
            (index === 3 && selectedPosting?.generatedResume)

          return (
            <Step 
              key={label} 
              completed={index < activeStep}
              onClick={() => {
                if (isClickable) {
                  setActiveStep(index)
                }
              }}
              sx={{ 
                cursor: isClickable ? 'pointer' : 'not-allowed',
                '& .MuiStepLabel-root': {
                  '&:hover': isClickable ? {
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                    transition: '0.2s'
                  } : {},
                },
                '& .MuiStepLabel-label': {
                  // Current step
                  ...(index === activeStep && {
                    color: 'primary.main',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }),
                  // Completed steps
                  ...(index < activeStep && {
                    color: 'success.main'
                  }),
                  // Future steps
                  ...(index > activeStep && {
                    color: isClickable ? 'text.primary' : 'text.disabled'
                  })
                },
                '& .MuiStepIcon-root': {
                  // Current step
                  ...(index === activeStep && {
                    fontSize: '2rem',
                    color: 'primary.main'
                  }),
                  // Completed steps
                  ...(index < activeStep && {
                    color: 'success.main'
                  }),
                  // Future steps
                  ...(index > activeStep && {
                    color: isClickable ? 'primary.light' : 'action.disabled'
                  })
                }
              }}
            >
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {label}
                  {index === activeStep && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      Current
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          )
        })}
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