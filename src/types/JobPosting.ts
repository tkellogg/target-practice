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
  generatedResume?: string;
  analysis?: JobAnalysis;
}

export interface JobAnalysis {
  title: string;
  roleDescription: string;
  companyDescription: string;
  requiredSkills: string[];
  optionalSkills: string[];
  successCriteria: string[];
} 