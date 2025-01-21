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

import React, { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { EditableText } from './EditableText';
import { LLMFeedbackBadge, LLMIssue } from './LLMFeedbackBadge';
import { AnecdoteAugmentation } from './AnecdoteAugmentation';
import { Experience } from '../types/Resume';

interface ResumeSectionProps {
  title: string;
  content: string;
  issues: LLMIssue[];
  onRegenerate: () => Promise<void>;
  onChange: (newContent: string) => void;
  experience?: Experience;
  type?: 'description' | 'skills' | 'accomplishments';
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  title,
  content,
  issues,
  onRegenerate,
  onChange,
  experience,
  type,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAcceptSuggestions = (suggestions: string[]) => {
    if (type === 'description') {
      // For description, replace the entire content
      onChange(suggestions[0]);
    } else if (type === 'skills' || type === 'accomplishments') {
      // For skills and accomplishments, append new items
      const currentItems = content.split('\n').filter(Boolean);
      const newItems = [...currentItems, ...suggestions];
      onChange(newItems.join('\n'));
    }
  };

  const hasAnecdotes = experience?.anecdotes && experience.anecdotes.length > 0;
  const latestAnecdote = hasAnecdotes ? experience!.anecdotes![0].content : '';

  return (
    <Paper sx={{ p: 2, mb: 2, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ ml: 1 }}>
          <LLMFeedbackBadge 
            issues={issues} 
            onShowIssues={() => setShowIssues(!showIssues)} 
          />
        </Box>
        {hasAnecdotes && type && (
          <Box sx={{ ml: 'auto' }}>
            <AnecdoteAugmentation
              experience={experience!}
              type={type}
              anecdote={latestAnecdote}
              onAccept={handleAcceptSuggestions}
            />
          </Box>
        )}
      </Box>

      <EditableText
        value={content}
        onChange={onChange}
        multiline
      />

      {showIssues && issues.length > 0 && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="warning.main" gutterBottom>
            Issues Found:
          </Typography>
          {issues.map((issue, index) => (
            <Typography 
              key={index} 
              variant="body2" 
              color="text.secondary"
              sx={{ ml: 2 }}
            >
              • {issue.message}
            </Typography>
          ))}
          <Button
            variant="outlined"
            size="small"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            sx={{ mt: 1 }}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate Section'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}; 