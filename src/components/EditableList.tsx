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

import React, { useState } from 'react'
import { Box, IconButton, List, ListItem, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

interface Props {
  items: string[]
  title: string
  onChange: (items: string[]) => void
  collapsible?: boolean
}

export function EditableList({ items, title, onChange, collapsible = false }: Props) {
  const [newItem, setNewItem] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()])
      setNewItem('')
    }
  }

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAdd()
    }
  }

  if (!collapsible) {
    return (
      <Box>
        <List dense>
          {items.map((item, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" size="small" onClick={() => handleDelete(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              {item}
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder={`Add ${title}`}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ flex: 1 }}
          />
          <IconButton onClick={handleAdd} size="small">
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton 
          size="small" 
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ mr: 1 }}
        >
          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {!isExpanded ? items.join(', ') : title}
        </Typography>
      </Box>

      {isExpanded && (
        <>
          <List dense>
            {items.map((item, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => handleDelete(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                {item}
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder={`Add ${title}`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ flex: 1 }}
            />
            <IconButton onClick={handleAdd} size="small">
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  )
} 