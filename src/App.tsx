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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, useMediaQuery, CssBaseline } from '@mui/material'
import { Editor } from './pages/Editor'
import { JobPostings } from './pages/JobPostings'
import { RepoSelector } from './components/RepoSelector'
import { MenuBar } from './components/MenuBar'
import { useMemo } from 'react'

const DebugEditor = () => {
  console.log('[DEBUG] Rendering Editor route')
  return <Editor />
}

const DebugJobPostings = () => {
  console.log('[DEBUG] Rendering JobPostings route')
  return <JobPostings />
}

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
        <MenuBar />
        <Routes>
          <Route path="/" element={<DebugEditor />} />
          <Route path="/job-postings" element={<DebugJobPostings />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
} 