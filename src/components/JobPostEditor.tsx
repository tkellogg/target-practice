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

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import { useJobPostingStore } from '../stores/useJobPostingStore';
import { useResumeStore } from '../stores/useResumeStore';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { JobRequirements } from './JobRequirements';
import { generateAndSavePDF } from '../utils/pdf';
import { checkFileExists, parseRepoString } from '../utils/github';
import { ResumePreview } from './ResumePreview';

interface JobPostEditorProps {
  onClose: () => void;
}

export function JobPostEditor({ onClose }: JobPostEditorProps) {
  const { selectedPosting, updateRequirements } = useJobPostingStore();
  const { resume, selectedRepo } = useResumeStore();
  const { state, startAnalysis, startGeneration, startExport } = useWorkflowStore();

  // Check if PDF exists when component mounts or when selectedPosting changes
  useEffect(() => {
    const checkPDFExists = async () => {
      if (!selectedPosting || !selectedRepo) return;

      try {
        const { owner, repo } = parseRepoString(selectedRepo);
        const fileSlug = `${selectedPosting.company}-${selectedPosting.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const path = `job-postings/${fileSlug}.pdf`;
        console.log('[DEBUG] Checking for PDF at path:', path);
        const exists = await checkFileExists(owner, repo, path);
        console.log('[DEBUG] PDF exists?', exists);
        if (exists) {
          console.log('[DEBUG] Found existing PDF at:', path);
          useWorkflowStore.setState({ state: { status: 'pdf_ready', pdfPath: path } });
        }
      } catch (error) {
        console.error('Error checking PDF existence:', error);
      }
    };

    checkPDFExists();
  }, [selectedPosting, selectedRepo]);

  // Debug log state changes
  useEffect(() => {
    console.log('[DEBUG] Current workflow state:', state);
  }, [state]);

  // Map workflow state to stepper index
  const activeStep = (() => {
    switch (state.status) {
      case 'initial': return 0;
      case 'analyzing':
      case 'ready_for_review': return 1;
      case 'generating':
      case 'resume_ready':
      case 'exporting':
      case 'pdf_ready': return 2;
    }
  })();

  const handleAnalyze = async () => {
    if (!selectedPosting) return;
    await startAnalysis();
  };

  const handleGenerateResume = async () => {
    if (!selectedPosting) return;
    await startGeneration();
  };

  const handleExport = async () => {
    if (!selectedPosting || !resume || !selectedRepo) return;
    await startExport();
  };

  const handleBack = () => {
    // Reset to previous state based on current state
    switch (state.status) {
      case 'ready_for_review':
        useWorkflowStore.setState({ state: { status: 'initial' } });
        break;
      case 'resume_ready':
        useWorkflowStore.setState({ state: { status: 'ready_for_review' } });
        break;
      case 'pdf_ready':
        useWorkflowStore.setState({ state: { status: 'resume_ready' } });
        break;
    }
  };

  const handleNext = () => {
    switch (state.status) {
      case 'initial':
        if (selectedPosting?.analysis) {
          useWorkflowStore.setState({ state: { status: 'ready_for_review' } });
        }
        break;
      case 'ready_for_review':
        if (selectedPosting?.generatedResume) {
          useWorkflowStore.setState({ state: { status: 'resume_ready' } });
        } else {
          // If we don't have a generated resume yet, start generating one
          handleGenerateResume();
        }
        break;
    }
  };

  const handleUpdateRequirements = async (type: 'required' | 'optional', requirements: string[]) => {
    if (!selectedPosting) return;
    await updateRequirements(selectedPosting, type, requirements);
  };

  const steps = [
    'Review Posting',
    'Analyze Needs',
    'Generate'
  ];

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </Box>
      <Stepper activeStep={activeStep} sx={{ px: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 2
      }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6">Job Description</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedPosting?.rawText}</Typography>
          </Box>
        )}
        {activeStep === 1 && selectedPosting?.analysis && (
          <Box>
            <JobRequirements 
              analysis={selectedPosting.analysis} 
              isEditable={true}
              onUpdateRequirements={handleUpdateRequirements}
            />
          </Box>
        )}
        {activeStep === 2 && (
          <Box>
            {state.status === 'generating' ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Generating resume...</Typography>
              </Box>
            ) : selectedPosting?.generatedResume ? (
              <>
                <ResumePreview 
                  resume={resume} 
                  generatedResume={selectedPosting.generatedResume}
                />
              </>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <Typography color="text.secondary">
                  Click "Generate Preview" to create a customized resume
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
      <Box sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Box>
          {activeStep === 0 && (
            <Button 
              onClick={handleAnalyze}
              disabled={state.status === 'analyzing'}
            >
              {state.status === 'analyzing' ? <CircularProgress size={24} /> : 'Analyze Posting'}
            </Button>
          )}
          {activeStep === 1 && (
            <Button 
              onClick={handleGenerateResume}
              disabled={state.status === 'generating'}
            >
              {state.status === 'generating' ? <CircularProgress size={24} /> : 'Generate Preview'}
            </Button>
          )}
          {activeStep === 2 && (
            <>
              <Button 
                onClick={handleExport}
                disabled={state.status === 'exporting'}
                variant="outlined"
              >
                {state.status === 'exporting' ? <CircularProgress size={24} /> : 'Export PDF'}
              </Button>
              {state.status === 'pdf_ready' && 'pdfPath' in state && (
                <Button 
                  href={`https://github.com/${selectedRepo}/raw/main/${state.pdfPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ ml: 2 }}
                >
                  View PDF
                </Button>
              )}
            </>
          )}
        </Box>
        <Box>
          <Button 
            onClick={handleBack} 
            disabled={activeStep === 0}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Button 
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !selectedPosting?.analysis) ||
              (activeStep === 1 && !selectedPosting?.generatedResume) ||
              activeStep === 2
            }
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 