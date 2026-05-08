import type { ProviderResponse } from '@/types';

const TIMEOUT_MS = 20_000;
const MODEL = 'llama-3.3-70b-versatile'; // Groq current production model (replaces llama-3.1-70b-versatile)
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * Groq provides an OpenAI-compatible endpoint for Llama models.
 * Docs: https://console.groq.com/docs/openai
 */
export async function callLlama(question: string): Promise<ProviderResponse> {
  const start = Date.now();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      provider: 'llama',
      model: MODEL,
      rawAnswer: '',
      latencyMs: Date.now() - start,
      error: 'GROQ_API_KEY environment variable is not set.',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a precise, factual assistant. Answer concisely with verifiable information. If uncertain, say so clearly. Do not pad your response.',
          },
          { role: 'user', content: question },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage;

    // Groq Llama 3.1 70B pricing
    const inputCost = ((usage?.prompt_tokens ?? 0) / 1_000_000) * 0.59;
    const outputCost = ((usage?.completion_tokens ?? 0) / 1_000_000) * 0.79;

    return {
      provider: 'llama',
      model: MODEL,
      rawAnswer: content,
      latencyMs: Date.now() - start,
      tokenInput: usage?.prompt_tokens,
      tokenOutput: usage?.completion_tokens,
      costEstimateUsd: inputCost + outputCost,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Llama/Groq error';
    return {
      provider: 'llama',
      model: MODEL,
      rawAnswer: '',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}
