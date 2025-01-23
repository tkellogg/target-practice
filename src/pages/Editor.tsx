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
import { Box, Typography, CircularProgress, Dialog, Container } from '@mui/material'
import { useResumeStore } from '../stores/useResumeStore'
import { Resume, Experience, Position } from '../types/Resume'
import { ExperienceConversation } from '../components/ExperienceConversation'
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore'
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog'
import { ProjectConversation } from '../components/ProjectConversation'
import MasterResumeEditor from '../components/MasterResumeEditor'

function isPosition(obj: any): obj is Position {
  return obj && 
    typeof obj.title === 'string' &&
    typeof obj.startDate === 'string' &&
    typeof obj.endDate === 'string'
}

function isExperience(obj: any): obj is Experience {
  return obj && 
    typeof obj.company === 'string' &&
    typeof obj.dates === 'string' &&
    Array.isArray(obj.positions) &&
    obj.positions.every(isPosition) &&
    Array.isArray(obj.skills) &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.accomplishments)
}

export const Editor = () => {
  const { resume, isLoading, error } = useResumeStore()
  const { isOpen, experience, project } = useExperienceConversationStore()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Container maxWidth="lg">
          <MasterResumeEditor />
        </Container>
      </Box>

      {/* Dialogs */}
      <Dialog
        open={isOpen}
        onClose={() => useExperienceConversationStore.getState().setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {experience && (
          <ExperienceConversation
            experience={experience}
            onClose={() => useExperienceConversationStore.getState().setOpen(false)}
          />
        )}
        {project && (
          <ProjectConversation
            project={project}
            onClose={() => useExperienceConversationStore.getState().setOpen(false)}
          />
        )}
      </Dialog>
    </Box>
  )
} 