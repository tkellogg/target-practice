/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import React from 'react'
import { Box, Typography } from '@mui/material'
import { Resume } from '../types/Resume'

interface Props {
  resume: Resume | null
}

export const ResumePreview: React.FC<Props> = ({ resume }) => {
  if (!resume) {
    return null
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Generated Resume</Typography>
      {/* Resume preview content */}
    </Box>
  )
} 