/**
 * Copyright (c) 2025. See LICENSE for details.
 */

import React, { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { EditableText } from './EditableText';
import { LLMFeedbackBadge, LLMIssue } from './LLMFeedbackBadge';

interface ResumeSectionProps {
  title: string;
  content: string;
  issues: LLMIssue[];
  onRegenerate: () => Promise<void>;
  onChange: (newContent: string) => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  title,
  content,
  issues,
  onRegenerate,
  onChange,
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