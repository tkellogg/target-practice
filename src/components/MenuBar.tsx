/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { AppBar, Toolbar, Button, Box, Container, Tab, Tabs } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { useResumeStore } from '../stores/useResumeStore'
import { Link, useLocation } from 'react-router-dom'

export const MenuBar = () => {
  const { resume, updateResume } = useResumeStore()
  const location = useLocation()

  const handleSave = () => {
    if (resume) {
      updateResume(resume)
    }
  }

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Tabs value={location.pathname} sx={{ flex: 1 }}>
            <Tab 
              label="Resume Editor" 
              value="/" 
              component={Link} 
              to="/"
            />
            <Tab 
              label="Job Postings" 
              value="/job-postings" 
              component={Link} 
              to="/job-postings"
            />
          </Tabs>
          <Button
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!resume}
          >
            Save
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  )
} 