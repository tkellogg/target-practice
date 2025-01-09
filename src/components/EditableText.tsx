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