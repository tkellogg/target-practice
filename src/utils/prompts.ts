/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import type { JobPosting } from '../types/JobPosting';

export function generateResumePrompt(posting: JobPosting, resume: string): string {
  return `You are a professional resume writer helping a candidate tailor their resume for a specific job posting.

Job Posting:
${posting.rawText}

Current Resume:
${resume}

Please rewrite the resume to highlight relevant experience and skills for this role. Focus on:
1. Matching keywords and requirements from the job posting
2. Quantifying achievements where possible
3. Using active voice and strong action verbs
4. Maintaining truthfulness while emphasizing relevant experience

Return ONLY the revised resume text, with no additional commentary.`;
} 