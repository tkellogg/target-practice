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

import { Resume } from '../types/Resume'

export const defaultResume: Resume = {
  personalInfo: {
    name: 'Your Name',
    address: 'Your Address',
    phone: 'Your Phone',
    email: 'your.email@example.com',
    description: 'A brief description of yourself'
  },
  experience: [],
  projects: [],
  patents: []
} 