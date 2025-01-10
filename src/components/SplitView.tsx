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

import { ReactNode } from 'react'
import { Grid, Paper, Box, Typography, useTheme } from '@mui/material'

interface SplitViewProps {
  leftTitle?: string
  rightTitle?: string
  leftContent: ReactNode
  rightContent: ReactNode
  leftWidth?: number // percentage, defaults to 50
  maxHeight?: string | number
}

export const SplitView = ({
  leftTitle,
  rightTitle,
  leftContent,
  rightContent,
  leftWidth = 50,
  maxHeight = '80vh'
}: SplitViewProps) => {
  const theme = useTheme()
  const rightWidth = 100 - leftWidth

  return (
    <Grid container spacing={2} sx={{ width: '100%' }}>
      <Grid item xs={12} md={leftWidth / 100 * 12}>
        <Paper 
          elevation={1} 
          sx={{ 
            height: '100%',
            maxHeight,
            overflow: 'auto',
            p: 2,
            borderRight: `1px solid ${theme.palette.divider}`
          }}
        >
          {leftTitle && (
            <Typography variant="h6" gutterBottom>
              {leftTitle}
            </Typography>
          )}
          <Box sx={{ height: '100%' }}>
            {leftContent}
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={rightWidth / 100 * 12}>
        <Paper 
          elevation={1} 
          sx={{ 
            height: '100%',
            maxHeight,
            overflow: 'auto',
            p: 2
          }}
        >
          {rightTitle && (
            <Typography variant="h6" gutterBottom>
              {rightTitle}
            </Typography>
          )}
          <Box sx={{ height: '100%' }}>
            {rightContent}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
} 