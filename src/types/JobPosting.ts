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
  selectedExperienceAccomplishments: Record<number, number[]>;  // exp_idx -> acc_idxs
  selectedExperienceSkills: Record<number, number[]>;  // exp_idx -> skill_idxs
  selectedProjectAccomplishments: Record<number, number[]>;  // proj_idx -> acc_idxs
  selectedProjectSkills: Record<number, number[]>;  // proj_idx -> skill_idxs
  experienceMap: Array<{
    accomplishments: Array<{ id: string }>;
    skills: Array<{ id: string }>;
  }>;
} 