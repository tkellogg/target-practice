/**
 * Copyright (c) 2025. See LICENSE for details.
 */

import React from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export interface LLMIssue {
  type: 'missing' | 'excess' | 'incorrect';
  message: string;
}

interface LLMFeedbackBadgeProps {
  issues: LLMIssue[];
  onShowIssues: () => void;
}

export const LLMFeedbackBadge: React.FC<LLMFeedbackBadgeProps> = ({ issues, onShowIssues }) => {
  if (issues.length === 0) return null;

  return (
    <Tooltip title={`${issues.length} issue${issues.length === 1 ? '' : 's'} found`}>
      <IconButton size="small" onClick={onShowIssues}>
        <Badge badgeContent={issues.length} color="warning">
          <ErrorOutlineIcon color="action" />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}; 