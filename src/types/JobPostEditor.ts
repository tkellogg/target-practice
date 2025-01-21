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