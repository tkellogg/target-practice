/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import * as dotenv from 'dotenv'
// Load env vars before anything else
dotenv.config()

import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { generateConversationStartersPrompt, generateConversationPrompt, summarizeConversationPrompt, analyzeJobPostingPrompt } from './src/utils/prompts'
import type { Experience } from './src/types/Resume'

const app: Express = express()
const port = 3002

app.use(cors())
app.use(express.json())

const CLAUDE_MODEL = 'claude-3-5-sonnet-latest'

// Log env vars for debugging
console.log('API Key present?', !!process.env.VITE_ANTH_API_KEY)

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTH_API_KEY
})

app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body
    
    console.log('Analyze request:', { prompt }) // Per rules: Log everything
    
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('AI Analysis:', content) // Per rules: Log everything
    
    res.json({ content: response.content })
  } catch (error) {
    console.error('Error analyzing:', error)
    res.status(500).json({ error: 'Failed to analyze' })
  }
})

app.post('/api/conversation', async (req: Request, res: Response) => {
  const { messages, experience } = req.body as {
    messages: Array<{ role: 'user' | 'assistant', content: string }>,
    experience: Experience
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You are an expert interviewer helping a user expand on their job experiences with insightful follow-up questions',
      messages: generateConversationPrompt(experience, messages)
    })

    res.json({ response: response.content[0].type === 'text' ? response.content[0].text : '' })
  } catch (error) {
    console.error('Error in conversation:', error)
    res.status(500).json({ error: 'Failed to process conversation' })
  }
})

app.post('/api/suggestions', async (req: Request, res: Response) => {
  try {
    const { experience } = req.body
    
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: generateConversationStartersPrompt(experience)
      }]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Per .cursorrules: trim everything before '{' and after '}'
    // Since we're expecting an array, we'll trim before '[' and after ']'
    const startIdx = content.indexOf('[')
    const endIdx = content.lastIndexOf(']') + 1
    const cleanJson = content.substring(startIdx, endIdx)
    
    const suggestions = JSON.parse(cleanJson)
    
    console.log('Generated suggestions:', suggestions) // Per .cursorrules: Log everything on backend
    
    res.json({ suggestions })
    
  } catch (error) {
    console.error('Error generating suggestions:', error)
    res.status(500).json({ error: 'Failed to generate suggestions' })
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