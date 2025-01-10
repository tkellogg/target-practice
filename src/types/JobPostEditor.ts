/**
 * Copyright (c) 2024. See LICENSE for details.
 */

import type { ReactNode } from 'react';

export interface AISection {
  id: string;
  content: string;
  suggestions: AISuggestion[];
  userFeedback: string;
  lastUpdated: string;
}

export interface AISuggestion {
  id: string;
  text: string;
  isAccepted: boolean;
  timestamp: string;
  type: 'truthfulness' | 'coverage' | 'detail' | 'hiring_manager' | 'company_fit';
}

export interface SectionSuggestions {
  overview: AISuggestion[];
  summary: AISuggestion[];
  experience: Record<string, AISuggestion[]>; // Key is job ID
  openSource: Record<string, AISuggestion[]>; // Key is project ID
}

export type SectionType = 'overview' | 'summary' | 'experience' | 'openSource';

export interface SectionProps {
  type: SectionType;
  content: string;
  suggestions: AISuggestion[];
  onUpdate: (content: string) => void;
  onRegenerateSection: (feedback: string, acceptedSuggestions: string[]) => void;
  children?: ReactNode;
} 