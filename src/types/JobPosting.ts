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
  selectedExperienceAccomplishments: Record<string, string[]>;  // exp_id -> acc_ids
  selectedExperienceSkills: Record<string, string[]>;  // exp_id -> skill_ids
  selectedProjectAccomplishments: Record<string, string[]>;  // proj_id -> acc_ids
  selectedProjectSkills: Record<string, string[]>;  // proj_id -> skill_ids
} 