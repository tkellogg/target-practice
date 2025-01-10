/*
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

import { JobPosting } from '../types/JobPosting'
import { AISuggestion } from '../types/JobPostEditor'

export const extractJobInfoPrompt = (rawText: string): string => `
Extract the company name and job title from this job posting. Return as JSON with "company" and "title" fields.

Job Posting:
${rawText}`

export const analyzeJobPostingPrompt = (rawText: string): string => `
Analyze this job posting and extract the following information in JSON format:
1. title: The exact job title
2. roleDescription: A concise description of the role and its responsibilities
3. companyDescription: A brief description of the company
4. requiredSkills: Array of specific required skills/qualifications
5. optionalSkills: Array of nice-to-have skills/qualifications
6. successCriteria: Array of what would make someone successful in this role

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "roleDescription": "string",
  "companyDescription": "string",
  "requiredSkills": ["string"],
  "optionalSkills": ["string"],
  "successCriteria": ["string"]
}

Job Posting:
${rawText}`

export const generateResumePrompt = (posting: JobPosting, originalResume: string): string => `
Generate a targeted resume for this job posting. Use the original resume as a source of truth for experience and achievements.

Original Resume:
${originalResume}

Job Description:
${posting.rawText}

Analysis:
${JSON.stringify(posting.analysis)}

Guidelines:
1. Keep all dates and company names exactly as they appear in the original resume
2. Maintain truthfulness - don't invent or exaggerate achievements
3. Focus on relevant experience and skills for this specific role
4. Quantify achievements where possible
5. Use active voice and strong action verbs
6. Organize in clear sections: Overview, Summary, Experience, Open Source Projects`

export interface SuggestionPromptResult {
  prompt: string;
  companyMap: Record<string, string>;
}

export const generateSuggestionsPrompt = (
  posting: JobPosting,
  companyNames: string[]
): SuggestionPromptResult => {
  // Create a mapping of companies to their original names
  const companyMap = Object.fromEntries(
    companyNames.map(name => [name, name])
  );
  console.log("Prompting with companies:", companyMap);

  const prompt = `
You are a resume improvement assistant. Analyze this generated resume and provide suggestions for improvement.
You MUST provide suggestions for EVERY section, including experience entries and open source projects.
Use the EXACT company names from the list below - do not substitute or make up companies.

Companies to analyze (ALWAYS include ALL in your response):
${Object.keys(companyMap).map(name => `- ${name}`).join('\n')}

Return ONLY valid JSON matching this exact structure, with no additional text or formatting:
{
  "overview": [{"text": "suggestion text", "type": "truthfulness|coverage|detail|hiring_manager|company_fit"}],
  "summary": [{"text": "suggestion text", "type": "truthfulness|coverage|detail|hiring_manager|company_fit"}],
  "experience": {
    ${Object.keys(companyMap).map(name => 
      `"${name}": [{"text": "suggestion text", "type": "truthfulness|coverage|detail|hiring_manager|company_fit"}]`
    ).join(',\n    ')}
  },
  "openSource": {
    // Use actual project names from the resume's open source section
    // Each project should have its own array of suggestions
    // Example: "project_name": [{"text": "suggestion text", "type": "truthfulness|coverage|detail|hiring_manager|company_fit"}]
  }
}

Consider these aspects when making suggestions:
1. Truthfulness - Does it match the original resume? (type: "truthfulness")
2. Coverage - Are key details from master resume included? (type: "coverage")
3. Detail - Remove unnecessary details (type: "detail")
4. Hiring Manager View - Qualifications/red flags (type: "hiring_manager")
5. Company Fit - Startup vs enterprise culture fit (type: "company_fit")

For experience entries, focus on:
- Alignment with job requirements
- Quantifiable achievements
- Technical depth
- Leadership/impact

For open source projects, focus on:
- Relevance to role
- Technical complexity
- Impact and adoption
- Code quality/practices

Original Resume:
${posting.rawText}

Generated Resume:
${posting.generatedResume}

Job Description:
${posting.rawText}

Remember:
1. Use EXACT company names listed above for experience suggestions
2. Use EXACT project names from the resume for open source suggestions
3. Every section must have at least one suggestion
4. Use ONLY these types: "truthfulness", "coverage", "detail", "hiring_manager", "company_fit"
5. You MUST include ALL companies in your response, even if you have no suggestions for some companies`

  return { prompt, companyMap }
}

export const regenerateSectionPrompt = (
  posting: JobPosting,
  acceptedSuggestions: AISuggestion[],
  feedback: string
): string => `
Regenerate this section of the resume, incorporating these suggestions and feedback:

Suggestions to apply:
${acceptedSuggestions.map(s => `- ${s.text}`).join('\n')}

User feedback:
${feedback}

Current content:
${posting.generatedResume}

Job Description:
${posting.rawText}

Return only the updated content for this specific section.` 