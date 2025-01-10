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

import React, { useState } from 'react'
import { TextField, Typography, Box } from '@mui/material'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  variant?: 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'subtitle1' | 'subtitle2'
  multiline?: boolean
  sx?: any
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  variant = 'body1',
  multiline = false,
  sx = {}
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  const handleClick = () => {
    setIsEditing(true)
    setTempValue(value)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (tempValue !== value) {
      onChange(tempValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setTempValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <TextField
        fullWidth
        multiline={multiline}
        minRows={multiline ? 3 : 1}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        sx={{ ...sx, mb: multiline ? 2 : 0 }}
      />
    )
  }

  return (
    <Box onClick={handleClick} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
      <Typography variant={variant} sx={sx}>
        {value}
      </Typography>
    </Box>
  )
} 