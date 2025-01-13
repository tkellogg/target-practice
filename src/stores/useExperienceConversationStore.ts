/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { create } from 'zustand';
import type { Experience } from '../types/Resume';

interface ExperienceConversationState {
  isOpen: boolean;
  currentExperience: Experience | null;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  setOpen: (isOpen: boolean) => void;
  setExperience: (experience: Experience | null) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setMessages: (messages: Array<{ role: 'user' | 'assistant', content: string }>) => void;
  setSuggestions: (suggestions: string[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useExperienceConversationStore = create<ExperienceConversationState>((set) => ({
  isOpen: false,
  currentExperience: null,
  messages: [],
  suggestions: [],
  isLoading: false,
  error: null,

  setOpen: (isOpen) => set({ isOpen }),
  
  setExperience: (experience) => set({ 
    currentExperience: experience,
    messages: [],
    suggestions: [],
    error: null
  }),

  addMessage: (role, content) => set((state) => ({
    messages: [...state.messages, { role, content }]
  })),

  setMessages: (messages) => set({ messages }),

  setSuggestions: (suggestions) => set({ suggestions }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set({
    isOpen: false,
    currentExperience: null,
    messages: [],
    suggestions: [],
    isLoading: false,
    error: null
  })
})); 