/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import express, { Express, Request, Response } from 'express'
import { config } from 'dotenv'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import type { Experience } from './src/types/Resume.ts'
import type { JobPosting, JobAnalysis } from './src/types/JobPosting.ts'
import type { Resume } from './src/types/Resume.ts'

config()

const app: Express = express()
app.use(
  cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // If you want credentials (cookies, etc.), set this to true
    credentials: false
  })
);

app.options('*', cors());

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTH_API_KEY!
})

const CLAUDE_MODEL = 'claude-3-5-sonnet-latest' as const;

app.post('/api/analyze', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTH_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: req.body.prompt }]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Anthropic API failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error calling Anthropic API:', error)
      res.status(500).json({ error: error.message || 'Failed to call Anthropic API' })
    } else {
      console.error('Unknown error calling Anthropic API')
      res.status(500).json({ error: 'Failed to call Anthropic API' })
    }
  }
})

app.post('/api/suggestions', async (req, res) => {
  try {
    const { experience } = req.body;
    
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You must respond with ONLY a JSON array of strings, nothing else.
        Each string should be a conversation starter question about this job experience: ${JSON.stringify(experience)}
        Generate 3-5 questions that help expand on metrics, specific projects, and concrete achievements.
        Example format: ["Question 1?", "Question 2?", "Question 3?"]

        Focus on:
        - Company: ${experience.company}
        - Role: ${experience.positions[0].title}
        - Skills: ${experience.skills.join(', ')}
        - Key accomplishments: ${experience.accomplishments.join(', ')}`
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Per .cursorrules: trim everything before '{' and after '}'
    // Since we're expecting an array, we'll trim before '[' and after ']'
    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']') + 1;
    const cleanJson = content.substring(startIdx, endIdx);
    
    const suggestions = JSON.parse(cleanJson);
    
    console.log('Generated suggestions:', suggestions); // Per .cursorrules: Log everything on backend
    
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

app.post('/api/conversation', async (req: Request, res: Response) => {
  const { messages, experience } = req.body as {
    messages: Array<{ role: 'user' | 'assistant', content: string }>,
    experience: Experience
  };

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You are an expert interviewer helping a user expand on their job experience. Ask thoughtful follow-up questions to help them articulate detailed anecdotes, metrics, and accomplishments. Focus on extracting concrete examples and measurable impacts.',
      messages: [
        {
          role: 'user',
          content: `Context about the job:
Company: ${experience.company}
Role: ${experience.positions[0].title}
Description: ${experience.description}
Skills: ${experience.skills.join(', ')}
Accomplishments: ${experience.accomplishments.join('\n')}`
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]
    });

    res.json({ response: response.content[0].type === 'text' ? response.content[0].text : '' });
  } catch (error) {
    console.error('Error in conversation:', error);
    res.status(500).json({ error: 'Failed to process conversation' });
  }
});

app.post('/api/summarize', async (req: Request, res: Response) => {
  const { messages, experience } = req.body as {
    messages: Array<{ role: 'user' | 'assistant', content: string }>,
    experience: Experience
  };

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You are an expert at summarizing job experiences into clear, impactful anecdotes. Take the conversation and create a concise but detailed summary that captures the key metrics, challenges, solutions, and impacts discussed.',
      messages: [
        {
          role: 'user',
          content: `Summarize this conversation about a job experience into a clear, detailed anecdote:

Context:
Company: ${experience.company}
Role: ${experience.positions[0].title}

Conversation:
${messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}`
        }
      ]
    });

    res.json({ summary: response.content[0].type === 'text' ? response.content[0].text : '' });
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    res.status(500).json({ error: 'Failed to summarize conversation' });
  }
});

app.post('/api/job-postings/generate-resume', async (req: Request, res: Response) => {
  try {
    const { posting, resume } = req.body as { posting: JobPosting, resume: Resume };
    
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a professional resume writer helping a candidate tailor their resume for a specific job posting.

Job Posting:
${posting.rawText}

Current Resume:
${JSON.stringify(resume, null, 2)}

Please rewrite the resume to highlight relevant experience and skills for this role. Focus on:
1. Matching keywords and requirements from the job posting
2. Quantifying achievements where possible
3. Using active voice and strong action verbs
4. Maintaining truthfulness while emphasizing relevant experience

Return ONLY the revised resume text, with no additional commentary.`
      }]
    });

    const generatedResume = response.content[0].type === 'text' ? response.content[0].text : '';
    
    console.log('Generated resume for:', posting.company, posting.title); // Per .cursorrules: Log everything on backend
    
    res.json({ generatedResume });
  } catch (error) {
    console.error('Error generating resume:', error);
    res.status(500).json({ error: 'Failed to generate resume' });
  }
});

app.listen(3002, () => {
  console.log('Server running on port 3002')
})

export const handler = app 