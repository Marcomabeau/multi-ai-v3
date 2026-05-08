import Anthropic from '@anthropic-ai/sdk';
import type { ProviderResponse } from '@/types';

const TIMEOUT_MS = 30_000;
const MAX_TOKENS = 800;
const MODEL = 'claude-3-haiku-20240307'; // Cost-effective; swap to claude-3-5-sonnet for higher quality

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }
  return new Anthropic({ apiKey });
}

export async function callClaude(question: string): Promise<ProviderResponse> {
  const start = Date.now();

  try {
    const client = getClient();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Claude request timed out')), TIMEOUT_MS)
    );

    const requestPromise = client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        'You are a precise, factual assistant. Answer concisely with verifiable information. If uncertain, say so clearly. Do not pad your response.',
      messages: [{ role: 'user', content: question }],
    });

    const message = await Promise.race([requestPromise, timeoutPromise]);

    const content =
      message.content[0]?.type === 'text' ? message.content[0].text : '';

    const inputCost = ((message.usage?.input_tokens ?? 0) / 1_000_000) * 0.25;
    const outputCost = ((message.usage?.output_tokens ?? 0) / 1_000_000) * 1.25;

    return {
      provider: 'claude',
      model: MODEL,
      rawAnswer: content,
      latencyMs: Date.now() - start,
      tokenInput: message.usage?.input_tokens,
      tokenOutput: message.usage?.output_tokens,
      costEstimateUsd: inputCost + outputCost,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Claude error';
    return {
      provider: 'claude',
      model: MODEL,
      rawAnswer: '',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}
