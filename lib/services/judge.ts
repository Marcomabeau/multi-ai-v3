import Anthropic from '@anthropic-ai/sdk';
import type { ProviderResponse, JudgeResult } from '@/types';

const JUDGE_MODEL = 'claude-3-5-sonnet-20241022'; // Best reasoning for judge role
const TIMEOUT_MS = 45_000;

const JUDGE_SYSTEM_PROMPT = `You are the Evaluator/Judge for MULTI Ai.

Your job is not to be persuasive. Your job is to identify the best-supported answer.

You will receive:
1. The user's original question
2. Raw answers from multiple AI models
3. Web-grounded evidence and citations when available

Rules:
- Do not assume the majority is correct.
- Do not reward confident writing.
- Remove fluff, marketing language, vague claims, and unsupported statements.
- Identify factual agreement across models.
- Identify contradictions.
- Identify unsupported claims.
- Use source-backed evidence as stronger than model consensus.
- If evidence is insufficient, say clearly: "Not enough evidence."
- If the answer depends on current information, prioritize recent and authoritative sources.
- Output must be concise, factual, and directly useful.

Return valid JSON only using this schema:

{
  "final_answer": "string",
  "confidence_score": 0-100,
  "confidence_reason": "string",
  "key_facts": ["string"],
  "contradictions": ["string"],
  "unsupported_claims": ["string"],
  "source_trail": [
    {
      "claim": "string",
      "source": "string",
      "url": "string",
      "reliability": "high|medium|low"
    }
  ],
  "model_agreement": {
    "openai": "agree|disagree|partial|error",
    "gemini": "agree|disagree|partial|error",
    "claude": "agree|disagree|partial|error",
    "perplexity": "agree|disagree|partial|error",
    "llama": "agree|disagree|partial|error"
  },
  "final_warning": "string|null"
}

Return ONLY the JSON object. No preamble, no explanation, no markdown fences.`;

function buildJudgeUserPrompt(
  question: string,
  responses: ProviderResponse[]
): string {
  const parts: string[] = [`ORIGINAL QUESTION:\n${question}\n`];

  for (const r of responses) {
    parts.push(`\n--- ${r.provider.toUpperCase()} (${r.model}) ---`);
    if (r.error) {
      parts.push(`ERROR: ${r.error}`);
    } else {
      parts.push(`ANSWER:\n${r.rawAnswer}`);
      if (r.citations && r.citations.length > 0) {
        parts.push(`CITATIONS:`);
        r.citations.forEach((c, i) => {
          parts.push(`  [${i + 1}] ${c.source} — ${c.url}`);
        });
      }
    }
  }

  return parts.join('\n');
}

export async function callJudge(
  question: string,
  responses: ProviderResponse[]
): Promise<JudgeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Graceful fallback: if no API key, synthesise a basic result from available responses
  if (!apiKey) {
    console.warn('[Judge] ANTHROPIC_API_KEY not set — returning fallback result');
    return buildFallbackResult(responses, 'Judge unavailable: ANTHROPIC_API_KEY not configured.');
  }

  const client = new Anthropic({ apiKey });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Judge request timed out')), TIMEOUT_MS)
  );

  const requestPromise = client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 1500,
    system: JUDGE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildJudgeUserPrompt(question, responses),
      },
    ],
    temperature: 0.1,
  });

  const message = await Promise.race([requestPromise, timeoutPromise]);

  const rawText =
    message.content[0]?.type === 'text' ? message.content[0].text : '';

  return parseJudgeResponse(rawText, responses);
}

function parseJudgeResponse(
  raw: string,
  responses: ProviderResponse[]
): JudgeResult {
  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as JudgeResult;

    // Validate required fields with safe fallbacks
    return {
      final_answer: String(parsed.final_answer ?? 'Not enough evidence to determine an answer.'),
      confidence_score: clamp(Number(parsed.confidence_score ?? 0), 0, 100),
      confidence_reason: String(parsed.confidence_reason ?? ''),
      key_facts: Array.isArray(parsed.key_facts) ? parsed.key_facts : [],
      contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions : [],
      unsupported_claims: Array.isArray(parsed.unsupported_claims) ? parsed.unsupported_claims : [],
      source_trail: Array.isArray(parsed.source_trail) ? parsed.source_trail : [],
      model_agreement: {
        openai: validateAgreement(parsed.model_agreement?.openai, responses),
        gemini: validateAgreement(parsed.model_agreement?.gemini, responses),
        claude: validateAgreement(parsed.model_agreement?.claude, responses),
        perplexity: validateAgreement(parsed.model_agreement?.perplexity, responses),
        llama: validateAgreement(parsed.model_agreement?.llama, responses),
      },
      final_warning: parsed.final_warning ?? null,
    };
  } catch (parseError) {
    // If JSON parsing fails, return a safe fallback result
    console.error('Judge JSON parse error:', parseError, '\nRaw:', raw);

    const agreementMap = Object.fromEntries(
      responses.map((r) => [r.provider, r.error ? 'error' : 'partial'])
    ) as JudgeResult['model_agreement'];

    return {
      final_answer: raw.slice(0, 2000) || 'The judge could not produce a structured result.',
      confidence_score: 0,
      confidence_reason: 'Judge output could not be parsed as structured JSON.',
      key_facts: [],
      contradictions: [],
      unsupported_claims: [],
      source_trail: [],
      model_agreement: {
        ...{ openai: 'error' as const, gemini: 'error' as const, claude: 'error' as const, perplexity: 'error' as const, llama: 'error' as const },
        ...agreementMap,
      },
      final_warning: 'Judge output parsing failed. Raw response preserved.',
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function validateAgreement(
  value: unknown,
  _responses: ProviderResponse[]
): 'agree' | 'disagree' | 'partial' | 'error' {
  const valid = ['agree', 'disagree', 'partial', 'error'];
  if (typeof value === 'string' && valid.includes(value)) {
    return value as 'agree' | 'disagree' | 'partial' | 'error';
  }
  return 'error';
}

function buildFallbackResult(
  responses: ProviderResponse[],
  warning: string
): JudgeResult {
  const successful = responses.filter((r) => !r.error && r.rawAnswer);
  const firstAnswer = successful[0]?.rawAnswer ?? 'No model responses available.';
  const agreementMap = Object.fromEntries(
    responses.map((r) => [r.provider, r.error ? 'error' : 'partial'])
  ) as JudgeResult['model_agreement'];

  return {
    final_answer: firstAnswer,
    confidence_score: 0,
    confidence_reason: 'Judge model unavailable. Showing first successful model response without cross-verification.',
    key_facts: [],
    contradictions: [],
    unsupported_claims: [],
    source_trail: successful.flatMap((r) => r.citations ?? []),
    model_agreement: {
      openai: 'error', gemini: 'error', claude: 'error',
      perplexity: 'error', llama: 'error',
      ...agreementMap,
    },
    final_warning: warning,
  };
}
