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
import { Box, Typography, Chip, IconButton, Menu, MenuItem } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { Resume } from '../types/Resume'
import { GeneratedResume } from '../types/JobPosting'
import { useJobPostingStore } from '../stores/useJobPostingStore'

interface Props {
  resume: Resume | null
  generatedResume: GeneratedResume
}

export function ResumePreview({ resume, generatedResume }: Props) {
  if (!resume) return null;

  const { selectedPosting, optimisticUpdate } = useJobPostingStore();
  const [skillsMenuAnchor, setSkillsMenuAnchor] = React.useState<null | { element: HTMLElement, expIndex: number }>(null);
  const [accomplishmentsMenuAnchor, setAccomplishmentsMenuAnchor] = React.useState<null | { element: HTMLElement, expIndex: number }>(null);

  const handleRemoveSkill = (expIndex: number, skillIndex: number) => {
    if (!selectedPosting?.generatedResume) return;

    const newSkills = [...(selectedPosting.generatedResume.selectedExperienceSkills[expIndex] || [])];
    newSkills.splice(newSkills.indexOf(skillIndex), 1);

    const updatedPosting = {
      ...selectedPosting,
      generatedResume: {
        ...selectedPosting.generatedResume,
        selectedExperienceSkills: {
          ...selectedPosting.generatedResume.selectedExperienceSkills,
          [expIndex]: newSkills
        }
      }
    };
    optimisticUpdate(updatedPosting);
  };

  const handleRemoveAccomplishment = (expIndex: number, accIndex: number) => {
    if (!selectedPosting?.generatedResume) return;

    const newAccomplishments = [...(selectedPosting.generatedResume.selectedExperienceAccomplishments[expIndex] || [])];
    newAccomplishments.splice(newAccomplishments.indexOf(accIndex), 1);

    const updatedPosting = {
      ...selectedPosting,
      generatedResume: {
        ...selectedPosting.generatedResume,
        selectedExperienceAccomplishments: {
          ...selectedPosting.generatedResume.selectedExperienceAccomplishments,
          [expIndex]: newAccomplishments
        }
      }
    };
    optimisticUpdate(updatedPosting);
  };

  const handleAddSkill = (expIndex: number, skillIndex: number) => {
    if (!selectedPosting?.generatedResume) return;

    const newSkills = [...(selectedPosting.generatedResume.selectedExperienceSkills[expIndex] || [])];
    if (!newSkills.includes(skillIndex)) {
      newSkills.push(skillIndex);
    }

    const updatedPosting = {
      ...selectedPosting,
      generatedResume: {
        ...selectedPosting.generatedResume,
        selectedExperienceSkills: {
          ...selectedPosting.generatedResume.selectedExperienceSkills,
          [expIndex]: newSkills
        }
      }
    };
    optimisticUpdate(updatedPosting);
    setSkillsMenuAnchor(null);
  };

  const handleAddAccomplishment = (expIndex: number, accIndex: number) => {
    if (!selectedPosting?.generatedResume) return;

    const newAccomplishments = [...(selectedPosting.generatedResume.selectedExperienceAccomplishments[expIndex] || [])];
    if (!newAccomplishments.includes(accIndex)) {
      newAccomplishments.push(accIndex);
    }

    const updatedPosting = {
      ...selectedPosting,
      generatedResume: {
        ...selectedPosting.generatedResume,
        selectedExperienceAccomplishments: {
          ...selectedPosting.generatedResume.selectedExperienceAccomplishments,
          [expIndex]: newAccomplishments
        }
      }
    };
    optimisticUpdate(updatedPosting);
    setAccomplishmentsMenuAnchor(null);
  };

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
        const availableSkills = exp.skills.map((_, idx) => idx).filter(idx => !selectedSkills.includes(idx));
        const availableAccomplishments = exp.accomplishments.map((_, idx) => idx).filter(idx => !selectedAccomplishments.includes(idx));

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
            <>
              <Typography variant="subtitle2" mt={1}>Key Accomplishments:</Typography>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {selectedAccomplishments.map((accIndex) => (
                  <li key={accIndex} style={{ display: 'flex', alignItems: 'center' }}>
                    <Typography style={{ flex: 1 }}>• {exp.accomplishments[accIndex]}</Typography>
                    <IconButton size="small" onClick={() => handleRemoveAccomplishment(i, accIndex)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </li>
                ))}
                {availableAccomplishments.length > 0 && (
                  <li>
                    <IconButton 
                      size="small" 
                      onClick={(event) => setAccomplishmentsMenuAnchor({ element: event.currentTarget, expIndex: i })}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </li>
                )}
              </ul>
            </>

            {/* Only show selected skills */}
            <>
              <Typography variant="subtitle2" mt={1}>Skills Used:</Typography>
              <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
                {selectedSkills.map((skillIndex) => (
                  <Chip
                    key={skillIndex}
                    label={exp.skills[skillIndex]}
                    size="small"
                    variant="outlined"
                    onDelete={() => handleRemoveSkill(i, skillIndex)}
                  />
                ))}
                {availableSkills.length > 0 && (
                  <Chip
                    icon={<AddIcon />}
                    size="small"
                    variant="outlined"
                    onClick={(event) => setSkillsMenuAnchor({ element: event.currentTarget, expIndex: i })}
                  />
                )}
              </Box>
            </>
          </Box>
        );
      })}

      {/* Skills Menu */}
      <Menu
        anchorEl={skillsMenuAnchor?.element}
        open={Boolean(skillsMenuAnchor)}
        onClose={() => setSkillsMenuAnchor(null)}
      >
        {skillsMenuAnchor && resume.experience[skillsMenuAnchor.expIndex].skills.map((skill, idx) => {
          const selectedSkills = generatedResume?.selectedExperienceSkills[skillsMenuAnchor.expIndex] || [];
          if (selectedSkills.includes(idx)) return null;
          return (
            <MenuItem key={idx} onClick={() => handleAddSkill(skillsMenuAnchor.expIndex, idx)}>
              {skill}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Accomplishments Menu */}
      <Menu
        anchorEl={accomplishmentsMenuAnchor?.element}
        open={Boolean(accomplishmentsMenuAnchor)}
        onClose={() => setAccomplishmentsMenuAnchor(null)}
      >
        {accomplishmentsMenuAnchor && resume.experience[accomplishmentsMenuAnchor.expIndex].accomplishments.map((acc, idx) => {
          const selectedAccomplishments = generatedResume?.selectedExperienceAccomplishments[accomplishmentsMenuAnchor.expIndex] || [];
          if (selectedAccomplishments.includes(idx)) return null;
          return (
            <MenuItem key={idx} onClick={() => handleAddAccomplishment(accomplishmentsMenuAnchor.expIndex, idx)}>
              {acc}
            </MenuItem>
          );
        })}
      </Menu>

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