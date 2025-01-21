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

export interface Position {
  title: string
  startDate: string
  endDate: string
}

export interface Experience {
  company: string
  positions: Position[]
  skills: string[]
  description: string
  accomplishments: string[]
  dates: string
  city: string
  anecdotes?: Anecdote[]
}

export interface Anecdote {
  id: string
  content: string
  timestamp: string
  conversationContext?: {
    role: string
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
  }
}

export interface Project {
  name: string
  url: string
  description: string
  technologies: string[]
  startDate?: string
  endDate?: string
  skills: string[]
  accomplishments: string[]
  anecdotes?: Anecdote[]
}

export interface Patent {
  number: string
  title: string
}

export interface PersonalInfo {
  name: string
  address: string
  phone: string
  email: string
  description: string
}

export interface Resume {
  personalInfo: PersonalInfo
  experience: Experience[]
  projects: Project[]
  patents: Patent[]
} 