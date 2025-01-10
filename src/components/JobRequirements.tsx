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

import { Box, Typography, Chip, Stack, Divider } from '@mui/material'
import { JobAnalysis } from '../types/JobPosting'
import { EditableList } from './EditableList'

interface JobRequirementsProps {
  analysis: JobAnalysis | null
  onUpdateRequirements?: (type: 'required' | 'optional', requirements: string[]) => void
  onUpdateSuccessCriteria?: (criteria: string[]) => void
  isEditable?: boolean
}

export const JobRequirements = ({
  analysis,
  onUpdateRequirements,
  onUpdateSuccessCriteria,
  isEditable = false
}: JobRequirementsProps) => {
  if (!analysis) {
    return (
      <Typography color="text.secondary" align="center">
        No analysis available. Please analyze the job posting first.
      </Typography>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {analysis.title}
      </Typography>

      <Typography variant="body1" paragraph>
        {analysis.roleDescription}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        {analysis.companyDescription}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom color="primary">
        Required Skills
      </Typography>
      {isEditable ? (
        <EditableList
          title="Required Skills"
          items={analysis.requiredSkills}
          onChange={(items) => onUpdateRequirements?.('required', items)}
        />
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {analysis.requiredSkills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      )}

      <Typography variant="subtitle1" gutterBottom color="secondary">
        Optional Skills
      </Typography>
      {isEditable ? (
        <EditableList
          title="Optional Skills"
          items={analysis.optionalSkills}
          onChange={(items) => onUpdateRequirements?.('optional', items)}
        />
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {analysis.optionalSkills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              color="secondary"
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom color="success.main">
        Success Criteria
      </Typography>
      {isEditable ? (
        <EditableList
          title="Success Criteria"
          items={analysis.successCriteria}
          onChange={(items) => {
            if (onUpdateSuccessCriteria) {
              onUpdateSuccessCriteria(items)
            }
          }}
        />
      ) : (
        <Box component="ul" sx={{ pl: 2, mt: 0 }}>
          {analysis.successCriteria.map((criterion, index) => (
            <Typography key={index} component="li" sx={{ mb: 1 }}>
              {criterion}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  )
} 