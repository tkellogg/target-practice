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
import { Box, Typography } from '@mui/material'
import { Resume } from '../types/Resume'
import { GeneratedResume } from '../types/JobPosting'

interface Props {
  resume: Resume | null
  generatedResume: GeneratedResume
}

export const ResumePreview: React.FC<Props> = ({ resume, generatedResume }) => {
  if (!resume) {
    return null
  }

  const selectedExperiences = resume.experience
    .filter((_, i) => generatedResume.selectedExperienceIds.includes(`exp_${i}`));

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Generated Resume</Typography>
      
      {/* Personal Info */}
      <Typography variant="h6">{resume.personalInfo.name}</Typography>
      <Typography color="text.secondary" gutterBottom>
        {resume.personalInfo.address} • {resume.personalInfo.phone} • {resume.personalInfo.email}
      </Typography>

      {/* Overview */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Overview</Typography>
      <Typography paragraph>{generatedResume.overview}</Typography>
      
      {/* Experience */}
      <Typography variant="subtitle1" gutterBottom>Experience</Typography>
      {selectedExperiences.map((exp, i) => (
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
      <Typography>{generatedResume.closing}</Typography>
    </Box>
  )
} 