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
import { List, ListItem, IconButton, TextField, Button, Box } from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material'

interface EditableListProps {
  items: string[]
  title: string
  onChange: (items: string[]) => void
}

export const EditableList: React.FC<EditableListProps> = ({ items, title, onChange }) => {
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newItem, setNewItem] = useState('')

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setEditValue(items[index])
  }

  const handleSave = (index: number) => {
    const newItems = [...items]
    newItems[index] = editValue
    onChange(newItems)
    setEditIndex(null)
    setEditValue('')
  }

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()])
      setNewItem('')
    }
  }

  return (
    <Box>
      <List>
        {items.map((item, index) => (
          <ListItem
            key={index}
            secondaryAction={
              <>
                {editIndex === index ? (
                  <IconButton edge="end" onClick={() => handleSave(index)}>
                    <SaveIcon />
                  </IconButton>
                ) : (
                  <IconButton edge="end" onClick={() => handleEdit(index)}>
                    <EditIcon />
                  </IconButton>
                )}
                <IconButton edge="end" onClick={() => handleDelete(index)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            {editIndex === index ? (
              <TextField
                fullWidth
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave(index)}
              />
            ) : (
              item
            )}
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={`Add new ${title}`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!newItem.trim()}
        >
          Add
        </Button>
      </Box>
    </Box>
  )
} 