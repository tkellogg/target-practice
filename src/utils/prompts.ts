/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import type { JobPosting } from '../types/JobPosting'
import type { Experience, Project, Resume } from '../types/Resume'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

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
 * Selects which experiences to include in a targeted resume
 */
export function selectExperiencesPrompt(posting: JobPosting, resume: Resume, experienceIds: string[]): string {
  return `You are a professional resume writer selecting which job experiences to include in a targeted resume.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Available Experiences:
${resume.experience.map((exp, i) => `
ID: ${experienceIds[i]}
Company: ${exp.company}
Description: ${exp.description}
Skills: ${exp.skills.join(', ')}
Accomplishments:
${exp.accomplishments.join('\n')}
`).join('\n')}

Please respond with a JSON object containing:
{
  "selectedIds": ["Array of experience IDs to include, in order of relevance"]
}`
}

/**
 * Generates a closing paragraph for a targeted resume
 */
export function generateResumeClosingPrompt(posting: JobPosting, selectedExperiences: Experience[]): string {
  return `You are a professional resume writer. Write an 8-10 sentence closing that calls out specific experiences at specific jobs and correlates them to job requirements.

Job Description:
${posting.rawText}

Job Analysis:
${posting.analysis?.roleDescription}
Required Skills: ${posting.analysis?.requiredSkills.join(', ')}
Optional Skills: ${posting.analysis?.optionalSkills.join(', ')}
Success Criteria: ${posting.analysis?.successCriteria.join(', ')}

Selected Experiences:
${selectedExperiences.map(exp => `
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
export function generateDescriptionSuggestionsPrompt(item: Experience | Project, anecdote: string, customPrompt?: string): string {
  const allAnecdotes = [
    anecdote,
    ...(item.anecdotes?.filter(a => a.content !== anecdote).map(a => a.content) || [])
  ]

  const isExperience = 'company' in item

  return `Write a concise ${isExperience ? 'job' : 'project'} description that explains what the ${isExperience ? 'product/project was and your role in it' : 'project does and your contributions to it'}.

RULES:
1. First explain what was being built (the product/project)
2. Then explain your role in relation to that ${isExperience ? 'product' : 'project'}
3. Omit specific technologies and metrics
4. Use active first person voice and past tense
5. Maximum 1 short sentence
6. Focus on the "what", not the "how"
${customPrompt ? `7. Additional instructions: ${customPrompt}` : ''}

Example:
"${isExperience ? 'Build a real-time analytics platform for processing customer data. Lead architecture and development of the backend systems.' : 'Created an open-source library for handling complex data structures. Designed the core architecture and implemented key features.'}"

Current Description:
${item.description}

Anecdotes:
${allAnecdotes.map((a, i) => `${i + 1}. ${a}`).join('\n\n')}

Please respond with a JSON object containing:
{
  "suggestions": ["One sentence: what the ${isExperience ? 'product' : 'project'} was + your role in it"]
}`
}

/**
 * Generates suggestions for additional skills based on an anecdote
 */
export function generateSkillsSuggestionsPrompt(item: Experience | Project, anecdote: string, customPrompt?: string): string {
  const allAnecdotes = [
    anecdote,
    ...(item.anecdotes?.filter(a => a.content !== anecdote).map(a => a.content) || [])
  ]

  const isExperience = 'company' in item

  return `You are a professional resume writer. Based on these anecdotes about a ${isExperience ? 'job experience' : 'project'}, suggest additional skills that should be listed. Limit to 10 new skills maximum.

${customPrompt ? `IMPORTANT: ${customPrompt}` : ''}

RULES:
1. DO NOT suggest any skills that are already in the current list
2. Only suggest skills that are clearly implied by the anecdotes
3. If you can't find 10 new skills, return fewer

Current Skills (DO NOT INCLUDE THESE):
${item.skills?.join(', ') || 'None'}

Anecdotes:
${allAnecdotes.map((a, i) => `${i + 1}. ${a}`).join('\n\n')}

Please respond with a JSON object containing:
{
  "suggestions": ["Array of suggested NEW skills not already in the current list, maximum 10"]
}`
}

/**
 * Generates suggestions for additional accomplishments based on an anecdote
 */
export function generateAccomplishmentsSuggestionsPrompt(item: Experience | Project, anecdote: string, customPrompt?: string): string {
  const allAnecdotes = [
    anecdote,
    ...(item.anecdotes?.filter(a => a.content !== anecdote).map(a => a.content) || [])
  ]

  const isExperience = 'company' in item

  return `You are a professional resume writer helping extract VERIFIABLE accomplishments from ${isExperience ? 'job experience' : 'project'} anecdotes. 

${customPrompt ? `IMPORTANT: ${customPrompt}` : ''}

STRICT RULES:
1. ONLY suggest accomplishments that are EXPLICITLY stated in the anecdotes
2. NEVER make up numbers, metrics, or details that aren't directly mentioned
3. DO NOT suggest any accomplishments that are similar to the current list
4. If you can't find 3 new explicit accomplishments, return fewer
5. Each accomplishment must be directly traceable to specific text in the anecdotes

Current Accomplishments (DO NOT SUGGEST SIMILAR ONES):
${item.accomplishments?.join('\n') || 'None'}

Anecdotes:
${allAnecdotes.map((a, i) => `${i + 1}. ${a}`).join('\n\n')}

Please respond with a JSON object containing:
{
  "suggestions": ["Array of NEW verifiable accomplishments not already covered, maximum 3"]
}`
} 