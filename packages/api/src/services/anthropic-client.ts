import Anthropic from '@anthropic-ai/sdk';
import type { AnthropicClient } from '@materfold/core';

export function resolveAnthropicApiKey(request: { header(name: string): string | undefined }): string | null {
  const headerKey = request.header('x-anthropic-api-key')?.trim();
  if (headerKey) {
    return headerKey;
  }

  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  return envKey || null;
}

export function createAnthropicClient(apiKey: string): AnthropicClient {
  return new Anthropic({ apiKey }) as unknown as AnthropicClient;
}