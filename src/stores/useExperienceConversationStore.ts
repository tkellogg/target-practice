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