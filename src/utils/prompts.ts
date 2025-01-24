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

import type { JobPosting } from '../types/JobPosting'
import type { Experience, Project, Resume } from '../types/Resume'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ExperienceMapItem = {
  expId: string;
  skills: Array<{ id: string; text: string; }>;
  accomplishments: Array<{ id: string; text: string; }>;
};

/**
 * Generates conversation starter questions for a job experience
 */
export function generateConversationStartersPrompt(experience: Experience): string {
  return `You must respond with ONLY a JSON array of strings, nothing else.
Each string should be a conversation starter question about this job experience: ${JSON.stringify(experience)}
Generate 3-5 questions that help expand on metrics, specific projects, and concrete achievements.
Example format: ["Question 1?", "Question 2?", "Question 3?"]

Focus on:
- Company: ${experience.company}
- Role: ${experience.positions[0].title}
- Skills: ${experience.skills.join(', ')}
- Key accomplishments: ${experience.accomplishments.join(', ')}`
}

/**
 * Generates the conversation context and prompt for the AI interviewer
 */
export function generateConversationPrompt(experience: Experience, messages: Message[]): Message[] {
  return [
    {
      role: 'user',
      content: `Context about the job:
Company: ${experience.company}
Role: ${experience.positions[0].title}
Description: ${experience.description}
Skills: ${experience.skills.join(', ')}
Accomplishments: ${experience.accomplishments.join('\n')}`
    },
    ...messages
  ]
}

/**
 * Summarizes a conversation about a job experience into an anecdote
 */
export function summarizeConversationPrompt(experience: Experience, messages: Message[]): string {
  return `Summarize this conversation about a job experience into a clear, detailed anecdote:

Context:
Company: ${experience.company}
Role: ${experience.positions[0].title}

Conversation:
${messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}`
}

/**
 * Analyzes a job posting to extract key information
 */
export function analyzeJobPostingPrompt(posting: JobPosting): string {
  return `You are a professional resume writer analyzing a job posting. Please analyze this job posting and extract key information:

Job Posting:
${posting.rawText}

Please respond with a JSON object containing:
{
  "title": "The exact job title",
  "roleDescription": "A clear 2-3 sentence description of the role and its responsibilities",
  "companyDescription": "A brief description of the company and its context",
  "requiredSkills": ["Array of specific required skills, technologies, and qualifications"],
  "optionalSkills": ["Array of preferred or optional skills"],
  "successCriteria": ["Array of 3-5 key factors that would make a candidate successful in this role"]
}`
}

/**
 * Generates an overview for a targeted resume
 */
export function generateResumeOverviewPrompt(posting: JobPosting, resume: Resume): string {
  return `You are a professional resume writer. Write a 2-sentence overview that summarizes character traits & experience directly relevant to this job.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Resume Overview:
${resume.personalInfo.description}

Please respond with a JSON object containing:
{
  "overview": "The 2-sentence overview"
}`
}

/**
 * Selects which accomplishments and skills to include in a targeted resume
 */
export function selectExperiencesPrompt(posting: JobPosting, resume: Resume, experienceIds: string[]): string {
  // Generate random IDs for each skill and accomplishment
  const generateId = () => Math.random().toString(36).substring(2, 10);
  
  // Map of generated IDs to track what was selected
  const experienceMap = resume.experience.reduce((map, exp, i) => {
    map[i] = {
      id: `exp_${i}`,
      skills: exp.skills.map(skill => ({ id: `skill_${generateId()}`, text: skill })),
      accomplishments: exp.accomplishments.map(acc => ({ id: `acc_${generateId()}`, text: acc }))
    };
    return map;
  }, {} as Record<number, { 
    id: string,
    accomplishments: { id: string; text: string }[],
    skills: { id: string; text: string }[]
  }>);

  return `You are a professional resume writer selecting which accomplishments and skills to include in a targeted resume.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Available Experiences:
${Object.entries(experienceMap).map(([i, exp]) => `
ID: ${exp.id}
Company: ${resume.experience[parseInt(i)].company}
Description: ${resume.experience[parseInt(i)].description}
Skills:
${exp.skills.map(s => `${s.id}: ${s.text}`).join('\n')}
Accomplishments:
${exp.accomplishments.map(a => `${a.id}: ${a.text}`).join('\n')}
`).join('\n')}

IMPORTANT: DO NOT select entire experiences. Instead, select specific accomplishments and skills within EACH experience that are most relevant to this job.

Please respond with a JSON object containing:
{
  "selectedExperienceAccomplishments": {
    "exp_0": ["acc_xyz123", "acc_abc456"],  // IDs of relevant accomplishments for experience 0
    "exp_1": ["acc_def789", "acc_ghi012"],  // For experience 1, etc.
    // Include ALL experiences, even if none selected
  },
  "selectedExperienceSkills": {
    "exp_0": ["skill_jkl345", "skill_mno678"],  // IDs of relevant skills for experience 0
    "exp_1": ["skill_pqr901", "skill_stu234"],  // For experience 1, etc.
    // Include ALL experiences, even if none selected
  }
}`
}

/**
 * Generates a closing paragraph for a targeted resume
 */
export function generateResumeClosingPrompt(posting: JobPosting, experiences: Experience[]): string {
  return `You are a professional resume writer. Write an 8-10 sentence closing that calls out specific experiences at specific jobs and correlates them to job requirements.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Available Experiences:
${experiences.map(exp => `
Company: ${exp.company}
Description: ${exp.description}
Skills: ${exp.skills.join(', ')}
Accomplishments:
${exp.accomplishments.join('\n')}
`).join('\n')}

Please respond with a JSON object containing:
{
  "closing": "The 8-10 sentence closing paragraph"
}`
}

/**
 * Generates suggestions for augmenting a description based on an anecdote
 */
export function generateDescriptionSuggestionsPrompt(experience: Experience, anecdote: string, customPrompt?: string): string {
  return `You are helping to improve a job description based on an anecdote. The goal is to make the description more impactful and specific while maintaining accuracy.

Current job description:
${experience.description}

Anecdote providing additional context:
${anecdote}

${customPrompt ? `Additional instructions: ${customPrompt}\n` : ''}

Please generate a new job description that:
1. Incorporates key details from the anecdote
2. Maintains factual accuracy
3. Uses strong, active language
4. Stays concise (2-3 sentences)

Return your response in this JSON format:
{
  "suggestions": ["your suggested description"]
}`;
}

/**
 * Generates suggestions for additional skills based on an anecdote
 */
export function generateSkillsSuggestionsPrompt(experience: Experience, anecdote: string, customPrompt?: string): string {
  return `You are helping to identify additional skills based on an anecdote. The goal is to surface relevant technical and soft skills that were demonstrated but not explicitly listed.

Current skills:
${experience.skills.join(', ')}

Anecdote providing additional context:
${anecdote}

${customPrompt ? `Additional instructions: ${customPrompt}\n` : ''}

Please identify up to 10 additional skills that:
1. Are clearly evidenced in the anecdote
2. Would be valuable to highlight
3. Are not already listed
4. Are specific and concrete (e.g., "React" instead of just "JavaScript frameworks")

Return your response in this JSON format:
{
  "suggestions": ["skill 1", "skill 2", ...]
}`;
}

/**
 * Generates suggestions for additional accomplishments based on an anecdote
 */
export function generateAccomplishmentsSuggestionsPrompt(experience: Experience, anecdote: string, customPrompt?: string): string {
  return `You are helping to extract key accomplishments from an anecdote. The goal is to identify specific, measurable achievements that would strengthen the resume.

Current accomplishments:
${experience.accomplishments.join('\n')}

Anecdote providing additional context:
${anecdote}

${customPrompt ? `Additional instructions: ${customPrompt}\n` : ''}

Please suggest up to 3 additional accomplishments that:
1. Are clearly evidenced in the anecdote
2. Include specific metrics where possible
3. Use strong action verbs
4. Focus on impact and results
5. Are not redundant with existing accomplishments

Return your response in this JSON format:
{
  "suggestions": ["accomplishment 1", "accomplishment 2", "accomplishment 3"]
}`;
} 