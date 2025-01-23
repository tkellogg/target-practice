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

import { create } from 'zustand';
import { useJobPostingStore } from './useJobPostingStore';
import { useResumeStore } from './useResumeStore';
import { generateAndSavePDF } from '../utils/pdf';

type WorkflowState = 
  | { status: 'initial' }
  | { status: 'analyzing' }
  | { status: 'ready_for_review' }
  | { status: 'generating' }
  | { status: 'resume_ready' }
  | { status: 'exporting' }
  | { status: 'pdf_ready' };

interface WorkflowStore {
  state: WorkflowState;
  startAnalysis: () => Promise<void>;
  startGeneration: () => Promise<void>;
  startExport: () => Promise<void>;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  state: { status: 'initial' },

  startAnalysis: async () => {
    const { analyzePosting, selectedPosting } = useJobPostingStore.getState();
    if (!selectedPosting) return;

    set({ state: { status: 'analyzing' } });
    try {
      await analyzePosting(selectedPosting);
      set({ state: { status: 'ready_for_review' } });
    } catch (error) {
      set({ state: { status: 'initial' } });
      throw error;
    }
  },

  startGeneration: async () => {
    const { generateResume, selectedPosting } = useJobPostingStore.getState();
    const { resume } = useResumeStore.getState();
    if (!selectedPosting || !resume) return;

    set({ state: { status: 'generating' } });
    try {
      await generateResume(selectedPosting, resume);
      set({ state: { status: 'resume_ready' } });
    } catch (error) {
      // Stay in current state on error
      set({ state: { status: 'ready_for_review' } });
      throw error;
    }
  },

  startExport: async () => {
    const { selectedPosting } = useJobPostingStore.getState();
    const { selectedRepo } = useResumeStore.getState();
    if (!selectedPosting?.generatedResume || !selectedRepo) return;

    set({ state: { status: 'exporting' } });
    try {
      await generateAndSavePDF(selectedPosting, selectedRepo);
      set({ state: { status: 'pdf_ready' } });
    } catch (error) {
      set({ state: { status: 'resume_ready' } });
      throw error;
    }
  },

  reset: () => {
    set({ state: { status: 'initial' } });
  }
})); 