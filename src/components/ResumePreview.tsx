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
import { Box, Typography, Chip } from '@mui/material'
import { Resume } from '../types/Resume'
import { GeneratedResume } from '../types/JobPosting'
import { selectExperiencesPrompt } from '../utils/prompts'

interface Props {
  resume: Resume | null
  generatedResume: GeneratedResume
}

export function ResumePreview({ resume, generatedResume }: Props) {
  if (!resume) return null;

  return (
    <Box>
      {/* Personal Info */}
      <Typography variant="h5">{resume.personalInfo.name}</Typography>
      <Typography>{resume.personalInfo.email}</Typography>
      <Typography>{resume.personalInfo.phone}</Typography>
      <Typography>{resume.personalInfo.address}</Typography>

      {/* Overview */}
      {generatedResume?.overview && (
        <>
          <Typography variant="h6" mt={2}>Overview</Typography>
          <Typography>{generatedResume.overview}</Typography>
        </>
      )}

      {/* Experience */}
      <Typography variant="h6" mt={2}>Experience</Typography>
      {resume.experience.map((exp, i) => {
        const selectedAccomplishments = generatedResume?.selectedExperienceAccomplishments[i] || [];
        const selectedSkills = generatedResume?.selectedExperienceSkills[i] || [];

        return (
          <Box key={i} mt={1}>
            <Typography variant="subtitle1">{exp.company}</Typography>
            <Typography variant="body2" color="text.secondary">{exp.dates} • {exp.city}</Typography>
            {exp.positions.map((pos, j) => (
              <Box key={j}>
                <Typography variant="subtitle2">{pos.title}</Typography>
              </Box>
            ))}
            <Typography>{exp.description}</Typography>

            {/* Only show selected accomplishments */}
            {selectedAccomplishments.length > 0 && (
              <>
                <Typography variant="subtitle2" mt={1}>Key Accomplishments:</Typography>
                <ul>
                  {selectedAccomplishments.map((accIndex) => (
                    <li key={accIndex}>
                      <Typography>{exp.accomplishments[accIndex]}</Typography>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Only show selected skills */}
            {selectedSkills.length > 0 && (
              <>
                <Typography variant="subtitle2" mt={1}>Skills Used:</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedSkills.map((skillIndex) => (
                    <Chip
                      key={skillIndex}
                      label={exp.skills[skillIndex]}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        );
      })}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <>
          <Typography variant="h6" mt={2}>Projects</Typography>
          {resume.projects.map((project, i) => {
            const selectedAccomplishments = generatedResume?.selectedProjectAccomplishments[i] || [];
            const selectedSkills = generatedResume?.selectedProjectSkills[i] || [];

            return (
              <Box key={i} mt={1}>
                <Typography variant="subtitle1">{project.name}</Typography>
                <Typography variant="body2" color="text.secondary" component="a" href={project.url} target="_blank">
                  {project.url}
                </Typography>
                <Typography>{project.description}</Typography>

                {/* Only show selected accomplishments */}
                {selectedAccomplishments.length > 0 && (
                  <>
                    <Typography variant="subtitle2" mt={1}>Key Accomplishments:</Typography>
                    <ul>
                      {selectedAccomplishments.map((accIndex) => (
                        <li key={accIndex}>
                          <Typography>{project.accomplishments[accIndex]}</Typography>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Only show selected skills */}
                {selectedSkills.length > 0 && (
                  <>
                    <Typography variant="subtitle2" mt={1}>Skills Used:</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedSkills.map((skillIndex) => (
                        <Chip
                          key={skillIndex}
                          label={project.skills[skillIndex]}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            );
          })}
        </>
      )}

      {/* Patents */}
      {resume.patents && resume.patents.length > 0 && (
        <>
          <Typography variant="h6" mt={2}>Patents</Typography>
          {resume.patents.map((patent, i) => (
            <Box key={i} mt={1}>
              <Typography variant="subtitle1">{patent.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Patent #{patent.number}
              </Typography>
            </Box>
          ))}
        </>
      )}

      {/* Closing */}
      {generatedResume?.closing && (
        <>
          <Typography variant="h6" mt={2}>Closing</Typography>
          <Typography>{generatedResume.closing}</Typography>
        </>
      )}
    </Box>
  );
} 