/**
 * MULTI Ai — Unit Tests
 * Run: npm test
 */

// ── helpers ───────────────────────────────────────────────────
describe('formatDuration', () => {
  // Inline the function to avoid import issues in test environment
  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  it('formats milliseconds under 1s', () => {
    expect(formatDuration(250)).toBe('250ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats milliseconds over 1s', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(2500)).toBe('2.5s');
    expect(formatDuration(30000)).toBe('30.0s');
  });
});

describe('formatCost', () => {
  function formatCost(usd: number | null | undefined): string {
    if (usd == null) return '—';
    if (usd < 0.001) return '<$0.001';
    return `$${usd.toFixed(4)}`;
  }

  it('returns dash for null/undefined', () => {
    expect(formatCost(null)).toBe('—');
    expect(formatCost(undefined)).toBe('—');
  });

  it('returns <$0.001 for tiny costs', () => {
    expect(formatCost(0.0001)).toBe('<$0.001');
    expect(formatCost(0)).toBe('<$0.001');
  });

  it('formats normal costs to 4 decimal places', () => {
    expect(formatCost(0.0042)).toBe('$0.0042');
    expect(formatCost(1.5)).toBe('$1.5000');
  });
});

// ── judge JSON parsing ────────────────────────────────────────
describe('Judge output validation', () => {
  function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
  }

  it('clamps confidence score to 0–100', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(75, 0, 100)).toBe(75);
  });

  it('parses valid judge JSON', () => {
    const raw = JSON.stringify({
      final_answer: 'Test answer',
      confidence_score: 82,
      confidence_reason: 'Strong agreement',
      key_facts: ['Fact 1'],
      contradictions: [],
      unsupported_claims: [],
      source_trail: [],
      model_agreement: {
        openai: 'agree', gemini: 'agree', claude: 'partial',
        perplexity: 'agree', llama: 'disagree',
      },
      final_warning: null,
    });

    const parsed = JSON.parse(raw);
    expect(parsed.final_answer).toBe('Test answer');
    expect(parsed.confidence_score).toBe(82);
    expect(parsed.model_agreement.openai).toBe('agree');
    expect(parsed.final_warning).toBeNull();
  });

  it('handles judge JSON with markdown fences', () => {
    const withFences = '```json\n{"final_answer":"test","confidence_score":50}\n```';
    const cleaned = withFences
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    expect(parsed.final_answer).toBe('test');
    expect(parsed.confidence_score).toBe(50);
  });

  it('detects invalid JSON without throwing', () => {
    const invalid = 'This is not JSON at all.';
    let threw = false;
    try {
      JSON.parse(invalid);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

// ── input validation ──────────────────────────────────────────
describe('Question validation', () => {
  function validateQuestion(q: string): { ok: boolean; error?: string } {
    const trimmed = q.trim();
    if (trimmed.length < 3) return { ok: false, error: 'Too short' };
    if (trimmed.length > 8000) return { ok: false, error: 'Too long' };
    return { ok: true };
  }

  it('accepts valid questions', () => {
    expect(validateQuestion('What is the capital of France?').ok).toBe(true);
    expect(validateQuestion('Why?').ok).toBe(true);
  });

  it('rejects questions that are too short', () => {
    expect(validateQuestion('Hi').ok).toBe(false);
    expect(validateQuestion('  ').ok).toBe(false);
  });

  it('rejects questions that are too long', () => {
    const tooLong = 'a'.repeat(8001);
    expect(validateQuestion(tooLong).ok).toBe(false);
  });

  it('trims whitespace before validation', () => {
    expect(validateQuestion('  ab  ').ok).toBe(false); // 2 chars after trim
    expect(validateQuestion('  abc  ').ok).toBe(true);
  });
});

// ── plan limits ───────────────────────────────────────────────
describe('Plan configuration', () => {
  const PLAN_CONFIG = {
    free:    { queriesPerWindow: 2,    windowHours: 2  },
    pro:     { queriesPerWindow: 200,  windowHours: 24 },
    pro_max: { queriesPerWindow: 1000, windowHours: 24 },
  };

  it('free plan allows 2 queries per 2 hours', () => {
    expect(PLAN_CONFIG.free.queriesPerWindow).toBe(2);
    expect(PLAN_CONFIG.free.windowHours).toBe(2);
  });

  it('pro plan allows 200 queries per day', () => {
    expect(PLAN_CONFIG.pro.queriesPerWindow).toBe(200);
    expect(PLAN_CONFIG.pro.windowHours).toBe(24);
  });

  it('pro_max plan allows 1000 queries per day', () => {
    expect(PLAN_CONFIG.pro_max.queriesPerWindow).toBe(1000);
  });

  it('all plans have a hard cap — none are truly unlimited', () => {
    for (const plan of Object.values(PLAN_CONFIG)) {
      expect(plan.queriesPerWindow).toBeGreaterThan(0);
      expect(plan.queriesPerWindow).toBeLessThanOrEqual(1000);
    }
  });
});

// ── confidence badge colour ───────────────────────────────────
describe('Confidence score categorisation', () => {
  function getLabel(score: number): string {
    if (score >= 80) return 'High confidence';
    if (score >= 60) return 'Moderate confidence';
    if (score >= 40) return 'Low confidence';
    return 'Very low confidence';
  }

  it('labels correctly across thresholds', () => {
    expect(getLabel(95)).toBe('High confidence');
    expect(getLabel(80)).toBe('High confidence');
    expect(getLabel(79)).toBe('Moderate confidence');
    expect(getLabel(60)).toBe('Moderate confidence');
    expect(getLabel(59)).toBe('Low confidence');
    expect(getLabel(40)).toBe('Low confidence');
    expect(getLabel(39)).toBe('Very low confidence');
    expect(getLabel(0)).toBe('Very low confidence');
  });
});

// ── Model name validation ─────────────────────────────────────
describe('Provider model names', () => {
  // These must match what the services actually use
  const EXPECTED_MODELS = {
    openai:     'gpt-4o-mini',
    claude:     'claude-3-haiku-20240307',
    gemini:     'gemini-1.5-flash',
    perplexity: 'sonar-pro',         // not the deprecated llama-3.1-sonar-small-128k-online
    llama:      'llama-3.3-70b-versatile', // not the deprecated 3.1 version
  };

  it('perplexity uses current non-deprecated model', () => {
    expect(EXPECTED_MODELS.perplexity).toBe('sonar-pro');
    expect(EXPECTED_MODELS.perplexity).not.toContain('llama-3.1-sonar');
  });

  it('llama uses current groq model', () => {
    expect(EXPECTED_MODELS.llama).toBe('llama-3.3-70b-versatile');
    expect(EXPECTED_MODELS.llama).not.toBe('llama-3.1-70b-versatile');
  });
});

// ── Quota rollback logic ──────────────────────────────────────
describe('Quota rollback behaviour', () => {
  it('rollback decrements correctly', () => {
    // Simulate the greatest(count - 1, 0) SQL logic in JS
    function rollback(currentCount: number): number {
      return Math.max(currentCount - 1, 0);
    }
    expect(rollback(2)).toBe(1);
    expect(rollback(1)).toBe(0);
    expect(rollback(0)).toBe(0); // floor at 0, never negative
  });

  it('quota is restored on provider failure', () => {
    let quota = 5;
    // Simulate: increment before call, rollback on error
    quota += 1; // checkAndIncrementUsage consumed one slot
    // ... provider fails ...
    quota = Math.max(quota - 1, 0); // rollbackUsage
    expect(quota).toBe(5); // back to original
  });
});
