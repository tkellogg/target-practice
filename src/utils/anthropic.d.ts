/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

export type AnthropicResponse = {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

export function callAnthropicAPI(prompt: string): Promise<AnthropicResponse>; 