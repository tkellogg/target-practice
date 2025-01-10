/*
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