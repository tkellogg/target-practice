/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

export async function callAnthropicAPI(prompt: string, endpoint: string = '/api/analyze') {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error('Failed to call Anthropic API');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Add type for response
export type AnthropicResponse = Awaited<ReturnType<typeof callAnthropicAPI>>; 