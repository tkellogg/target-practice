/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { create } from 'zustand';
import type { Experience, Project } from '../types/Resume';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExperienceConversationState {
  isOpen: boolean;
  experience?: Experience;
  project?: Project;
  messages: Message[];
  suggestions: string[];
  isLoading: boolean;
  setOpen: (isOpen: boolean) => void;
  setExperience: (experience: Experience) => void;
  setProject: (project: Project) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useExperienceConversationStore = create<ExperienceConversationState>((set) => ({
  isOpen: false,
  messages: [],
  suggestions: [],
  isLoading: false,
  setOpen: (isOpen) => set({ isOpen }),
  setExperience: (experience) => set({ experience, project: undefined }),
  setProject: (project) => set({ project, experience: undefined }),
  addMessage: (role, content) => set((state) => ({
    messages: [...state.messages, { role, content }]
  })),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({
    isOpen: false,
    experience: undefined,
    project: undefined,
    messages: [],
    suggestions: [],
    isLoading: false
  })
})); 