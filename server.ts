import express from 'express'
import { config } from 'dotenv'

config()

const app = express()
app.use(express.json())

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
        model: 'claude-3-5-sonnet-latest',
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
    console.error('Error calling Anthropic API:', error)
    res.status(500).json({ error: error.message || 'Failed to call Anthropic API' })
  }
})

app.listen(3002, () => {
  console.log('API server running on port 3002')
})

export const handler = app 