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

import { useState } from 'react';
import { Box, IconButton, SxProps, TextField, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Preview';
import Markdown from 'markdown-to-jsx';

interface Props {
  value: string;
  onChange: (value: string) => void;
  sx?: SxProps;
}

export const EditableMarkdown = ({ value, onChange, sx }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const theme = useTheme();

  const markdownStyles = {
    p: 2,
    borderRadius: '2px',
    bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'background-color 0.2s',
    '&:hover': {
      bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
    },
    '& p': { my: 1 },
    '& ul, & ol': { my: 1, pl: 3 },
    '& li': { my: 0.5 },
    '& code': {
      px: 1,
      py: 0.5,
      borderRadius: '2px',
      bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
      fontFamily: 'monospace'
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setTempValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onChange(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <IconButton 
        size="small" 
        onClick={handleEditClick}
        sx={{ 
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
          '&:hover': {
            bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'grey.700',
          }
        }}
      >
        {isEditing ? <PreviewIcon fontSize="small" /> : <EditIcon fontSize="small" />}
      </IconButton>

      <Box> {/* Removed mt-4 since we're using padding now */}
        {isEditing ? (
          <TextField
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            variant="outlined"
            multiline
            autoFocus
            fullWidth
            minRows={4}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
              }
            }}
          />
        ) : (
          <Box sx={markdownStyles}>
            <Markdown>{value}</Markdown>
          </Box>
        )}
      </Box>
    </Box>
  );
}; 