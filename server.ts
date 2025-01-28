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

import * as dotenv from 'dotenv'
// Load env vars before anything else
dotenv.config()

import express, { Express, Request, Response, Router, RequestHandler } from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { 
  generateConversationStartersPrompt, 
  generateConversationPrompt, 
  summarizeConversationPrompt, 
  analyzeJobPostingPrompt,
  generateDescriptionSuggestionsPrompt,
  generateSkillsSuggestionsPrompt,
  generateAccomplishmentsSuggestionsPrompt
} from './src/utils/prompts'
import type { Experience } from './src/types/Resume'

const app: Express = express()
const router: Router = express.Router()
const port = 3002

app.use(cors())
app.use(express.json())

const CLAUDE_MODEL = 'claude-3-5-sonnet-latest'

// Log env vars for debugging
console.log('API Key present?', !!process.env.VITE_ANTH_API_KEY)

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTH_API_KEY
})

const analyzeHandler: RequestHandler = async (req, res) => {
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
}

const conversationHandler: RequestHandler = async (req, res) => {
  const { messages, experience, project } = req.body
  const item = experience || project

  if (!item) {
    res.status(400).json({ error: 'No experience or project provided' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You are an expert interviewer helping a user expand on their experiences with insightful follow-up questions',
      messages: generateConversationPrompt(item, messages)
    })

    res.json({ response: response.content[0].type === 'text' ? response.content[0].text : '' })
  } catch (error) {
    console.error('Error in conversation:', error)
    res.status(500).json({ error: 'Failed to process conversation' })
  }
}

const suggestionsHandler: RequestHandler = async (req, res) => {
  try {
    const { experience, project } = req.body
    const item = experience || project
    
    if (!item) {
      throw new Error('No experience or project provided')
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: generateConversationStartersPrompt(item)
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
}

const augmentHandler: RequestHandler = async (req, res) => {
  try {
    const { experience, type, anecdote, customPrompt } = req.body
    let prompt: string

    console.log('Augment request:', { type, customPrompt }) // Per rules: Log everything

    switch (type) {
      case 'description':
        prompt = generateDescriptionSuggestionsPrompt(experience, anecdote, customPrompt)
        break
      case 'skills':
        prompt = generateSkillsSuggestionsPrompt(experience, anecdote, customPrompt)
        break
      case 'accomplishments':
        prompt = generateAccomplishmentsSuggestionsPrompt(experience, anecdote, customPrompt)
        break
      default:
        throw new Error(`Invalid augmentation type: ${type}`)
    }

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
    console.log('AI Suggestions:', content) // Per rules: Log everything
    
    // Extract JSON from the response
    const json = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1))
    
    if (!json.suggestions || !Array.isArray(json.suggestions)) {
      throw new Error('Invalid response format from LLM')
    }

    res.json(json)
  } catch (error) {
    console.error('Error in /api/augment:', error)
    res.status(500).json({ error: 'Failed to generate suggestions' })
  }
}

const summarizeHandler: RequestHandler = async (req, res) => {
  const { messages, experience, project } = req.body
  const item = experience || project

  if (!item) {
    res.status(400).json({ error: 'No experience or project provided' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You are an expert at summarizing experiences into clear, impactful anecdotes. Take the conversation and create a concise but detailed summary that captures the key metrics, challenges, solutions, and impacts discussed.',
      messages: [
        {
          role: 'user',
          content: summarizeConversationPrompt(item, messages)
        }
      ]
    })

    res.json({ summary: response.content[0].type === 'text' ? response.content[0].text : '' })
  } catch (error) {
    console.error('Error summarizing conversation:', error)
    res.status(500).json({ error: 'Failed to summarize conversation' })
  }
}

router.post('/analyze', analyzeHandler)
router.post('/conversation', conversationHandler)
router.post('/suggestions', suggestionsHandler)
router.post('/augment', augmentHandler)
router.post('/summarize', summarizeHandler)

// Mount the router with the /api prefix
app.use('/api', router)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
}) 