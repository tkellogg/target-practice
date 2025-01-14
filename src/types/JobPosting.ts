/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

export interface JobPosting {
  id: string;
  company: string;
  title: string;
  url: string;
  rawText: string;
  analysis?: JobAnalysis;
  generatedResume?: GeneratedResume;
}

export interface JobAnalysis {
  title: string;
  roleDescription: string;
  companyDescription: string;
  requiredSkills: string[];
  optionalSkills: string[];
  successCriteria: string[];
}

export interface GeneratedResume {
  overview: string;
  closing: string;
  selectedExperienceIds: string[];  // IDs of selected experience items
} 