/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import React from 'react'
import { Box, Typography, TextField, useTheme } from '@mui/material'
import { JobPosting } from '../types/JobPosting'

interface Props {
  jobPosting: string
  onJobPostingChange: (text: string) => void
}

export const JobPostingReview: React.FC<Props> = ({ jobPosting, onJobPostingChange }) => {
  const theme = useTheme()

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Review Job Posting</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Paste the job posting text below. This will be analyzed to create a targeted resume.
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={10}
        maxRows={20}
        value={jobPosting}
        onChange={(e) => onJobPostingChange(e.target.value)}
        placeholder="Paste job posting here..."
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
          }
        }}
      />
    </Box>
  )
} 