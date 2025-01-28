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

import React, { useState, useEffect } from 'react'
import { TextField, Typography, Box, IconButton, useTheme, SxProps } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

export interface EditableTextProps {
  value: string
  onChange: (newValue: string) => void
  variant?: 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'subtitle1' | 'subtitle2'
  multiline?: boolean
  onDelete?: () => void
  forceEdit?: boolean
  sx?: SxProps
  placeholder?: string
}

export const EditableText = ({ value, onChange, variant = 'body1', multiline = false, onDelete, forceEdit = false, sx = {}, placeholder }: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const theme = useTheme()

  useEffect(() => {
    if (forceEdit && !isEditing) {
      setIsEditing(true)
      setTempValue(value)
    }
  }, [forceEdit, value])

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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering edit mode
    onDelete?.()
  }

  const DeleteButton = onDelete && (
    <IconButton
      size="small"
      onClick={handleDeleteClick}
      sx={{
        position: 'absolute',
        top: 4,
        right: 4,
        bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
        '&:hover': {
          bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
        }
      }}
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  )

  if (isEditing) {
    return (
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          multiline={multiline}
          minRows={multiline ? 3 : 1}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder={placeholder}
          sx={{ 
            ...sx,
            mb: multiline ? 2 : 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: '2px',
              pr: onDelete ? 5 : undefined // Make room for delete button
            }
          }}
        />
        {DeleteButton}
      </Box>
    )
  }

  return (
    <Box 
      sx={{ 
        position: 'relative',
        cursor: 'pointer',
        p: 1,
        pr: onDelete ? 5 : undefined, // Make room for delete button
        borderRadius: '2px',
        transition: 'background-color 0.2s',
        '&:hover': { 
          bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800'
        }
      }}
    >
      <Typography variant={variant} onClick={handleClick} sx={sx}>
        {value || placeholder}
      </Typography>
      {DeleteButton}
    </Box>
  )
} 