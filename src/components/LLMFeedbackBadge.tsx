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