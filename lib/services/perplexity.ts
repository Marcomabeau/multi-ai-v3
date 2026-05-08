import type { ProviderResponse, Citation } from '@/types';

const TIMEOUT_MS = 35_000; // Perplexity can be slower due to web search
const MODEL = 'sonar-pro'; // Current Perplexity production model (replaces deprecated llama-3.1-sonar-small-128k-online)

/**
 * Perplexity uses an OpenAI-compatible REST API.
 * Docs: https://docs.perplexity.ai/reference/post_chat_completions
 */
export async function callPerplexity(question: string): Promise<ProviderResponse> {
  const start = Date.now();
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return {
      provider: 'perplexity',
      model: MODEL,
      rawAnswer: '',
      latencyMs: Date.now() - start,
      error: 'PERPLEXITY_API_KEY environment variable is not set.',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
              'You are a precise, factual assistant with access to current web search. Answer concisely with verifiable information and include source references where possible. If uncertain, say so clearly.',
          },
          { role: 'user', content: question },
        ],
        return_citations: true,
        search_recency_filter: 'month',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    // Perplexity returns citations as an array of URLs in data.citations
    const rawCitations: string[] = data.citations ?? [];
    const citations: Citation[] = rawCitations.map((url: string, i: number) => ({
      claim: `Source ${i + 1}`,
      source: extractDomain(url),
      url,
      reliability: 'medium' as const,
    }));

    const usage = data.usage;
    // Perplexity pricing for sonar-small-online
    const inputCost = ((usage?.prompt_tokens ?? 0) / 1_000_000) * 0.2;
    const outputCost = ((usage?.completion_tokens ?? 0) / 1_000_000) * 0.2;

    return {
      provider: 'perplexity',
      model: MODEL,
      rawAnswer: content,
      citations,
      latencyMs: Date.now() - start,
      tokenInput: usage?.prompt_tokens,
      tokenOutput: usage?.completion_tokens,
      costEstimateUsd: inputCost + outputCost,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Perplexity error';
    return {
      provider: 'perplexity',
      model: MODEL,
      rawAnswer: '',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
