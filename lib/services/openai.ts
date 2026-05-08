import OpenAI from 'openai';
import type { ProviderResponse } from '@/types';

const TIMEOUT_MS = 30_000;
const MAX_TOKENS = 800;
const MODEL = 'gpt-4o-mini'; // Cost-effective; swap to gpt-4o for higher quality

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }
  return new OpenAI({ apiKey });
}

export async function callOpenAI(question: string): Promise<ProviderResponse> {
  const start = Date.now();

  try {
    const client = getClient();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: 'system',
            content:
              'You are a precise, factual assistant. Answer concisely with verifiable information. If uncertain, say so clearly. Do not pad your response.',
          },
          { role: 'user', content: question },
        ],
        temperature: 0.2,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const content = completion.choices[0]?.message?.content ?? '';
    const usage = completion.usage;

    const inputCost = ((usage?.prompt_tokens ?? 0) / 1_000_000) * 0.15;
    const outputCost = ((usage?.completion_tokens ?? 0) / 1_000_000) * 0.6;

    return {
      provider: 'openai',
      model: MODEL,
      rawAnswer: content,
      latencyMs: Date.now() - start,
      tokenInput: usage?.prompt_tokens,
      tokenOutput: usage?.completion_tokens,
      costEstimateUsd: inputCost + outputCost,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown OpenAI error';
    return {
      provider: 'openai',
      model: MODEL,
      rawAnswer: '',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}
