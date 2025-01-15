/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
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