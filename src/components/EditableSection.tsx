/**
 * Copyright (c) 2024. See LICENSE for details.
 */

import { useState } from 'react';
import { 
  Box,
  IconButton,
  Badge,
  Tooltip
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { EditableText } from './EditableText';
import { SuggestionPopover } from './SuggestionPopover';
import type { SectionProps } from '../types/JobPostEditor';

export function EditableSection({
  content,
  suggestions,
  onUpdate,
  onRegenerateSection,
  children
}: SectionProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleSuggestionClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSubmit = (feedback: string, acceptedSuggestions: string[]) => {
    onRegenerateSection(feedback, acceptedSuggestions);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <EditableText
            value={content}
            onChange={onUpdate}
            multiline
          />
          {children}
        </Box>
        
        <Tooltip title="View AI Suggestions">
          <IconButton 
            size="small" 
            onClick={handleSuggestionClick}
            sx={{ mt: 1 }}
          >
            <Badge 
              badgeContent={suggestions.length} 
              color="primary"
            >
              <LightbulbIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      <SuggestionPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        suggestions={suggestions}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </Box>
  );
} 