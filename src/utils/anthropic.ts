/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

export async function callAnthropicAPI(prompt: string) {
  const response = await fetch('/api/generate-resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error('Failed to call Anthropic API');
  }

  return response.json();
}

// Add type for response
export type AnthropicResponse = Awaited<ReturnType<typeof callAnthropicAPI>>; 