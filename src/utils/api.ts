function cleanJsonResponse(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  return text.slice(start, end + 1)
}

export async function callAnthropicAPI(prompt: string): Promise<any> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  })

  if (!response.ok) {
    throw new Error('Failed to call Anthropic API')
  }

  const data = await response.json()
  const cleanJson = cleanJsonResponse(data.content[0].text)
  return JSON.parse(cleanJson)
} 