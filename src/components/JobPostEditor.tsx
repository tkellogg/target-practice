/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import type { JobPosting } from '../types/JobPosting';
import { useJobPostingStore } from '../stores/useJobPostingStore';
import { useResumeStore } from '../stores/useResumeStore';
import { JobRequirements } from './JobRequirements';
import { generateAndSavePDF } from '../utils/pdf';
import { checkFileExists, parseRepoString } from '../utils/github';

const steps = [
  'Review Posting',
  'Analyze Needs',
  'Generate Resume',
];

interface JobPostEditorProps {
  posting: JobPosting;
  onClose: () => void;
}

export function JobPostEditor({ posting, onClose }: JobPostEditorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { resume } = useResumeStore();
  const { selectedRepo } = useResumeStore();
  const { generateResume, updatePosting, analyzePosting } = useJobPostingStore();

  useEffect(() => {
    const checkPDF = async () => {
      if (!selectedRepo || !posting) return;
      
      const { owner, repo } = parseRepoString(selectedRepo);
      const date = new Date().toISOString().split('T')[0];
      const fileSlug = `${posting.company}-${posting.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const path = `job-postings/${date}-${fileSlug}.pdf`;
      
      const url = await checkFileExists(owner, repo, path);
      setPdfUrl(url);
    };

    checkPDF();
  }, [selectedRepo, posting]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await analyzePosting(posting);
      setActiveStep(1);
    } catch (error) {
      console.error('Failed to analyze posting:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!resume) return;
    setIsGenerating(true);
    try {
      await generateResume(posting, resume);
    } catch (error) {
      console.error('Failed to generate resume:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!selectedRepo || !posting.generatedResume) return;
    setIsExporting(true);
    try {
      await generateAndSavePDF(posting, selectedRepo);
      // After exporting, check for the PDF again
      const { owner, repo } = parseRepoString(selectedRepo);
      const date = new Date().toISOString().split('T')[0];
      const fileSlug = `${posting.company}-${posting.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const path = `job-postings/${date}-${fileSlug}.pdf`;
      const url = await checkFileExists(owner, repo, path);
      setPdfUrl(url);
    } catch (error) {
      console.error('Failed to export resume:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{posting.company} — {posting.title}</Typography>
        <Button onClick={onClose}>Close</Button>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, i) => (
          <Step key={label}>
            <Button onClick={() => setActiveStep(i)}>
                <StepLabel>{label}</StepLabel>
            </Button>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Job Description</Typography>
            <Typography whiteSpace="pre-wrap">{posting.rawText}</Typography>
          </Box>
        )}
        {activeStep === 1 && (
          <JobRequirements 
            analysis={posting.analysis ?? null}
            isEditable={true}
            onUpdateRequirements={async (type, requirements) => {
              await updatePosting({
                ...posting,
                analysis: posting.analysis ? {
                  ...posting.analysis,
                  [type === 'required' ? 'requiredSkills' : 'optionalSkills']: requirements
                } : undefined
              });
            }}
            onUpdateSuccessCriteria={async (criteria) => {
              await updatePosting({
                ...posting,
                analysis: posting.analysis ? {
                  ...posting.analysis,
                  successCriteria: criteria
                } : undefined
              });
            }}
          />
        )}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Generated Resume</Typography>
            {posting.generatedResume ? (
              <>
                <Box sx={{ mb: 3, minHeight: 200 }}>
                  {isGenerating ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : posting.generatedResume && resume ? (
                    <Box>
                      {/* Personal Info */}
                      <Typography variant="h6" gutterBottom>{resume.personalInfo.name}</Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {resume.personalInfo.address} • {resume.personalInfo.phone} • {resume.personalInfo.email}
                      </Typography>

                      {/* Overview */}
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Overview</Typography>
                      <Typography whiteSpace="pre-wrap" paragraph>{posting.generatedResume.overview}</Typography>
                      
                      {/* Experience */}
                      <Typography variant="subtitle1" gutterBottom>Experience</Typography>
                      {resume.experience
                        .filter((_, i) => posting.generatedResume?.selectedExperienceIds.includes(`exp_${i}`))
                        .map((exp, i) => (
                          <Box key={i} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold">{exp.company}</Typography>
                            {exp.positions.map((pos, j) => (
                              <Typography key={j} variant="body2" color="text.secondary">
                                {pos.title} ({pos.startDate} - {pos.endDate})
                              </Typography>
                            ))}
                            <Typography paragraph>{exp.description}</Typography>
                            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                              {exp.accomplishments.map((acc, k) => (
                                <Typography key={k} component="li">{acc}</Typography>
                              ))}
                            </Box>
                          </Box>
                        ))}
                      
                      {/* Projects */}
                      {resume.projects.length > 0 && (
                        <>
                          <Typography variant="subtitle1" gutterBottom>Open Source Projects</Typography>
                          {resume.projects.map((proj, i) => (
                            <Box key={i} sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight="bold">{proj.name}</Typography>
                              <Typography color="primary" variant="body2" component="a" href={proj.url} target="_blank">
                                {proj.url}
                              </Typography>
                              <Typography paragraph>{proj.description}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Technologies: {proj.technologies.join(', ')}
                              </Typography>
                            </Box>
                          ))}
                        </>
                      )}

                      {/* Patents */}
                      {resume.patents.length > 0 && (
                        <>
                          <Typography variant="subtitle1" gutterBottom>Patents</Typography>
                          {resume.patents.map((patent, i) => (
                            <Typography key={i} paragraph>
                              {patent.title} (Patent #{patent.number})
                            </Typography>
                          ))}
                        </>
                      )}

                      {/* Closing */}
                      <Typography variant="subtitle1" gutterBottom>Closing</Typography>
                      <Typography whiteSpace="pre-wrap">{posting.generatedResume.closing}</Typography>
                    </Box>
                  ) : null}
                </Box>
              </>
            ) : (
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Click Generate to create a tailored resume based on the job requirements
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerateResume}
                  disabled={isGenerating}
                >
                  Generate Resume
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2}}>
            {activeStep === 0 && (
                <Button
                variant="outlined"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? <CircularProgress size={24} /> : 'Analyze Posting'}
                </Button>
            )}
            {(activeStep === 1 || activeStep === 2) && (
                <Button
                  variant="outlined"
                  onClick={handleGenerateResume}
                  disabled={isGenerating}
                  sx={{ mr: 2 }}
                >
                {activeStep === 2 ? 'Regenerate Preview' : 'Generate Preview'}
                </Button>
            )}
            {activeStep >= 2 && (
              <>
              <Button
                variant="contained"
                onClick={handleExport}
                disabled={isExporting || !posting.generatedResume}
              >
                {isExporting ? <CircularProgress size={24} /> : 'Export as PDF'}
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
              </>
            )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            >
            Back
            </Button>
            <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === steps.length - 1 || (activeStep === 0 && !posting.analysis)}
            >
            Next
            </Button>
        </Box>
      </Box>
    </Box>
  );
} 