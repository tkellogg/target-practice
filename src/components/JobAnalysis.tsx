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

import React from 'react'
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, CircularProgress, useTheme } from '@mui/material'
import { JobAnalysis as JobAnalysisType } from '../types/JobPosting'

interface Props {
  analyzing: boolean
  analysis: JobAnalysisType | null
}

export const JobAnalysis: React.FC<Props> = ({ analyzing, analysis }) => {
  const theme = useTheme()

  if (analyzing) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Analyze Requirements</Typography>
      
      <Paper sx={{ p: 3, mb: 3, bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'grey.900' }}>
        <Typography variant="h6" gutterBottom>Role Overview</Typography>
        <Typography paragraph>{analysis.roleDescription}</Typography>
        
        <Typography variant="h6" gutterBottom>Company</Typography>
        <Typography paragraph>{analysis.companyDescription}</Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'grey.900' }}>
        <Typography variant="h6" gutterBottom>Required Skills</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {analysis.requiredSkills.map((skill, index) => (
            <Chip 
              key={index} 
              label={skill} 
              color="primary"
              sx={{ 
                bgcolor: theme => theme.palette.mode === 'light' 
                  ? theme.palette.primary.main 
                  : theme.palette.primary.dark
              }}
            />
          ))}
        </Box>

        <Typography variant="h6" gutterBottom>Optional Skills</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {analysis.optionalSkills.map((skill, index) => (
            <Chip 
              key={index} 
              label={skill}
              variant="outlined"
              color="primary"
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'grey.900' }}>
        <Typography variant="h6" gutterBottom>Success Criteria</Typography>
        <List>
          {analysis.successCriteria.map((criterion, index) => (
            <ListItem key={index}>
              <ListItemText primary={criterion} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  )
} 