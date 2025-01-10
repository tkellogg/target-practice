/**
 * Copyright (c) 2024. See LICENSE for details.
 */

import { useState } from 'react';
import { 
  Popover, 
  Box, 
  Typography, 
  TextField, 
  Button,
  List,
  ListItem,
  Checkbox,
  ListItemText
} from '@mui/material';
import type { AISuggestion } from '../types/JobPostEditor';

interface SuggestionPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  suggestions: AISuggestion[];
  onClose: () => void;
  onSubmit: (feedback: string, acceptedSuggestions: string[]) => void;
}

export function SuggestionPopover({
  open,
  anchorEl,
  suggestions,
  onClose,
  onSubmit
}: SuggestionPopoverProps) {
  const [feedback, setFeedback] = useState('');
  const [checkedSuggestions, setCheckedSuggestions] = useState<string[]>(
    suggestions.filter(s => s.isAccepted).map(s => s.id)
  );

  const handleToggle = (id: string) => {
    setCheckedSuggestions(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    onSubmit(feedback, checkedSuggestions);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2, maxWidth: 400 }}>
        <Typography variant="h6" gutterBottom>
          AI Suggestions
        </Typography>
        
        <List>
          {suggestions.map((suggestion) => (
            <ListItem key={suggestion.id} dense>
              <Checkbox
                edge="start"
                checked={checkedSuggestions.includes(suggestion.id)}
                onChange={() => handleToggle(suggestion.id)}
              />
              <ListItemText primary={suggestion.text} />
            </ListItem>
          ))}
        </List>

        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          placeholder="Add your feedback or clarifications here..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          sx={{ mt: 2 }}
        />

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmit}
          >
            Apply Changes
          </Button>
        </Box>
      </Box>
    </Popover>
  );
} 