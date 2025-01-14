/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { generateConversationStartersPrompt, summarizeConversationPrompt } from './utils/prompts';
import type { Experience } from './types/Resume';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug log for API key presence
console.log('Environment check:');
console.log('- API Key present?', !!process.env.VITE_ANTH_API_KEY);
console.log('- API Key length:', process.env.VITE_ANTH_API_KEY?.length);
console.log('- All env vars:', Object.keys(process.env));

const app: Express = express();
const port = 3002;

app.use(cors());
app.use(express.json());

const CLAUDE_MODEL = 'claude-3-sonnet-20240229';

// Create Anthropic client with explicit error if key missing
if (!process.env.VITE_ANTH_API_KEY) {
  throw new Error('VITE_ANTH_API_KEY is required but not found in environment')
}

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTH_API_KEY
});

app.post('/api/suggestions', async (req: Request, res: Response) => {
  try {
    const { experience } = req.body;
    
    // Debug log the request
    console.log('Received experience:', JSON.stringify(experience, null, 2));
    
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: generateConversationStartersPrompt(experience)
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Per .cursorrules: trim everything before '{' and after '}'
    // Since we're expecting an array, we'll trim before '[' and after ']'
    const startIdx = content.indexOf('[')
    const endIdx = content.lastIndexOf(']') + 1
    const cleanJson = content.substring(startIdx, endIdx)
    
    const suggestions = JSON.parse(cleanJson)
    
    console.log('Generated suggestions:', suggestions) // Per .cursorrules: Log everything on backend
    
    // Make sure we never send undefined suggestions
    if (!suggestions) {
      throw new Error('No suggestions generated')
    }
    
    res.json({ suggestions: suggestions || [] })
    
  } catch (error) {
    console.error('Error generating suggestions:', error)
    // Send empty array instead of error to prevent frontend crash
    res.json({ suggestions: [] })
  }
})

app.post('/api/summarize', async (req: Request, res: Response) => {
  const { messages, experience } = req.body as {
    messages: Array<{ role: 'user' | 'assistant', content: string }>,
    experience: Experience
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You are an expert at summarizing job experiences into clear, impactful anecdotes. Take the conversation and create a concise but detailed summary that captures the key metrics, challenges, solutions, and impacts discussed.',
      messages: [
        {
          role: 'user',
          content: summarizeConversationPrompt(experience, messages)
        }
      ]
    })

    res.json({ summary: response.content[0].type === 'text' ? response.content[0].text : '' })
  } catch (error) {
    console.error('Error summarizing conversation:', error)
    res.status(500).json({ error: 'Failed to summarize conversation' })
  }
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
}) 