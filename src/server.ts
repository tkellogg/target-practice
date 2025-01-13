/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app: Express = express();
const port = 3002;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTH_API_KEY
});

app.post('/api/suggestions', async (req: Request, res: Response) => {
  try {
    const { experience } = req.body;
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Generate 3 conversation starter questions for a job experience. The questions should help gather interesting anecdotes and stories that demonstrate skills and achievements.

Experience details:
Company: ${experience.company}
Position: ${experience.positions[0].title}
Description: ${experience.description}
Skills: ${experience.skills.join(', ')}

Format the response as a JSON array of strings containing just the questions. For example:
["Question 1?", "Question 2?", "Question 3?"]`
      }]
    });

    // Extract just the JSON array from the response
    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const questions = JSON.parse(content.substring(content.indexOf('['), content.lastIndexOf(']') + 1));
    
    res.json(questions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

app.post('/api/conversation', async (req: Request, res: Response) => {
  try {
    const { messages, experience } = req.body;
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Context about the job:
Company: ${experience.company}
Role: ${experience.positions[0].title}
Description: ${experience.description}
Skills: ${experience.skills.join(', ')}
Accomplishments: ${experience.accomplishments.join('\n')}

Previous messages:
${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}`
      }]
    });

    res.json({ response: response.content[0].type === 'text' ? response.content[0].text : '' });
  } catch (error) {
    console.error('Error in conversation:', error);
    res.status(500).json({ error: 'Failed to process conversation' });
  }
});

app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const { messages, experience } = req.body;
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Summarize this conversation about a job experience into a concise anecdote that demonstrates skills and achievements.

Context about the job:
Company: ${experience.company}
Role: ${experience.positions[0].title}
Description: ${experience.description}
Skills: ${experience.skills.join(', ')}

Conversation:
${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}

Format the response as a JSON object with a 'summary' field containing the anecdote text. For example:
{"summary": "Led a team of 5 engineers to reduce API response times by 60% through implementing caching and optimizing database queries."}`
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const summary = JSON.parse(content);
    res.json(summary);
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    res.status(500).json({ error: 'Failed to summarize conversation' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 