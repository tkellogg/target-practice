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