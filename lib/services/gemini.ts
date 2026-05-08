import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProviderResponse } from '@/types';

const TIMEOUT_MS = 30_000;
const MODEL = 'gemini-1.5-flash'; // Cost-effective; swap to gemini-1.5-pro for higher quality

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function callGemini(question: string): Promise<ProviderResponse> {
  const start = Date.now();

  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction:
        'You are a precise, factual assistant. Answer concisely with verifiable information. If uncertain, say so clearly. Do not pad your response.',
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timed out')), TIMEOUT_MS)
    );

    const requestPromise = model.generateContent(question);
    const result = await Promise.race([requestPromise, timeoutPromise]);
    const response = result.response;
    const text = response.text();

    // Gemini usage metadata (available in newer SDK versions)
    const usageMeta = response.usageMetadata;
    const inputTokens = usageMeta?.promptTokenCount ?? 0;
    const outputTokens = usageMeta?.candidatesTokenCount ?? 0;

    // Gemini 1.5 Flash pricing (USD per 1M tokens)
    const inputCost = (inputTokens / 1_000_000) * 0.075;
    const outputCost = (outputTokens / 1_000_000) * 0.3;

    return {
      provider: 'gemini',
      model: MODEL,
      rawAnswer: text,
      latencyMs: Date.now() - start,
      tokenInput: inputTokens,
      tokenOutput: outputTokens,
      costEstimateUsd: inputCost + outputCost,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Gemini error';
    return {
      provider: 'gemini',
      model: MODEL,
      rawAnswer: '',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}
