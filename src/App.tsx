/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, useMediaQuery, CssBaseline } from '@mui/material'
import { Editor } from './pages/Editor'
import { JobPostings } from './pages/JobPostings'
import { RepoSelector } from './components/RepoSelector'
import { useMemo } from 'react'

export default function App() {
  // Use system preference for theme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

  // Create theme based on system preference
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Add this to get proper background colors */}
      <Router>
        <RepoSelector />
        <Routes>
          <Route path="/" element={<Editor />} />
          <Route path="/job-postings" element={<JobPostings />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
} 