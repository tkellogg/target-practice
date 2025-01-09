import React from 'react'
import { Box, Container, Tab, Tabs } from '@mui/material'
import { RepoSelector } from './components/RepoSelector'
import { Editor } from './pages/Editor'
import { JobPostings } from './pages/JobPostings'

export default function App() {
  const [tab, setTab] = React.useState(0)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <RepoSelector />
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="Resume Editor" />
          <Tab label="Job Postings" />
        </Tabs>
      </Box>

      {tab === 0 && <Editor />}
      {tab === 1 && <JobPostings />}
    </Container>
  )
} 