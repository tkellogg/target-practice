import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query
  })
  next()
})

app.post('/analyze', async (req, res) => {
  console.log('Received analyze request:', req.body)
  try {
    const { prompt } = req.body
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTH_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      res.status(response.status).send(error)
      return
    }

    const data = await response.json()
    console.log('Anthropic API response:', data)
    res.json(data)
  } catch (error) {
    console.error('Server error:', error)
    res.status(500).send(error.message)
  }
})

const port = process.env.PORT || 3002
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
}) 