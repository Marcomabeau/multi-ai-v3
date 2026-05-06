# MULTI Ai

**Best Verified Answer with Confidence Score and Source Trail.**

Ask one question → 5 AI models answer in parallel → AI Judge cross-checks everything → You get the best-supported answer.

> MULTI Ai does **not** claim to give 100% truth. It gives the best-verified, best-supported answer based on available evidence — with full transparency on confidence and sources.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Auth + DB | Supabase (Auth + Postgres) |
| Payments | Stripe (subscriptions + webhooks) |
| AI Providers | OpenAI, Anthropic Claude, Google Gemini, Perplexity, Groq (Llama) |
| Judge | Claude 3.5 Sonnet |
| Analytics | Google Analytics 4 |
| Deployment | Vercel (recommended) |

---

## Project Structure

```
multi-ai/
├── app/
│   ├── layout.tsx                    # Root layout (GA, dark mode init)
│   ├── globals.css                   # Design tokens + Tailwind base
│   ├── page.tsx                      # Landing page
│   ├── app/page.tsx                  # Main query interface
│   ├── login/page.tsx                # Auth page (login + signup)
│   ├── pricing/page.tsx              # Pricing page
│   ├── history/page.tsx              # Query history
│   ├── settings/page.tsx             # Account + billing
│   └── api/
│       ├── query/route.ts            # Core: parallel AI calls + judge
│       ├── history/route.ts          # Fetch user query history
│       ├── usage/route.ts            # Check usage/plan status
│       ├── create-checkout-session/  # Stripe checkout
│       ├── stripe-webhook/route.ts   # Stripe event handler
│       └── feedback/route.ts         # User feedback
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ThemeToggle.tsx
│   ├── QueryInput.tsx
│   ├── ResultCard.tsx
│   ├── ConfidenceBadge.tsx
│   ├── SourceTrail.tsx
│   ├── RawAnswerGrid.tsx
│   ├── LoadingPipeline.tsx
│   ├── PricingCards.tsx
│   ├── UsageLimitModal.tsx
│   └── AuthGuard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   └── server.ts                 # Server + admin Supabase client
│   ├── services/
│   │   ├── openai.ts                 # OpenAI provider
│   │   ├── claude.ts                 # Anthropic Claude provider
│   │   ├── gemini.ts                 # Google Gemini provider
│   │   ├── perplexity.ts             # Perplexity (web search) provider
│   │   ├── llama.ts                  # Llama via Groq provider
│   │   ├── judge.ts                  # Judge/evaluator logic
│   │   └── usageLimiter.ts           # Rate limit enforcement
│   └── utils/
│       ├── analytics.ts              # GA4 event helpers
│       └── helpers.ts                # cn, formatDate, validation, etc.
├── types/index.ts                    # Shared TypeScript types
├── middleware.ts                     # Supabase session refresh
├── supabase/migrations/
│   └── 001_initial_schema.sql        # DB schema + RLS policies
├── .env.example                      # Required environment variables
└── README.md
```

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo>
cd multi-ai
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Authentication → Settings** and configure your site URL
4. Copy your project URL, anon key, and service role key

### 3. Set up AI providers

| Provider | Where to get key |
|---|---|
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Perplexity | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |
| Groq (Llama) | [console.groq.com/keys](https://console.groq.com/keys) |

### 4. Set up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Go to **Products** and create two products:
   - **MULTI Ai Pro** — $19/month recurring → copy price ID
   - **MULTI Ai Pro Max** — $49/month recurring → copy price ID
3. Go to **Developers → API keys** → copy secret key
4. For webhooks (local): install [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
5. For production: create a webhook in Stripe Dashboard pointing to `https://yourdomain.com/api/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

### 5. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. See `.env.example` for the full list.

**Critical:** Never commit `.env.local`. It's in `.gitignore`.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Set your Stripe webhook URL to `https://your-vercel-domain.vercel.app/api/stripe-webhook`.

---

## Provider Implementation Status

| Provider | Status | Notes |
|---|---|---|
| OpenAI | ✅ Fully implemented | Uses `gpt-4o-mini`. Swap to `gpt-4o` for higher quality |
| Anthropic Claude | ✅ Fully implemented | Uses `claude-3-haiku-20240307` for speed/cost. Swap to `claude-3-5-sonnet-20241022` for quality |
| Google Gemini | ✅ Fully implemented | Uses `gemini-1.5-flash`. Swap to `gemini-1.5-pro` for quality |
| Perplexity | ✅ Fully implemented | Uses `llama-3.1-sonar-small-128k-online` — real-time web search + citations |
| Llama via Groq | ✅ Fully implemented | Uses `llama-3.1-70b-versatile` — fast inference via Groq |
| Judge | ✅ Fully implemented | Uses `claude-3-5-sonnet-20241022` — best reasoning for cross-model evaluation |

All providers degrade gracefully — if one fails, the other 4 still respond and the judge works with available data.

---

## Subscription Plans

| Plan | Limit | Price |
|---|---|---|
| Free | 2 queries / 2-hour rolling window | $0 |
| Pro | 200 queries / day | $19/month |
| Pro Max | 1,000 queries / day | $49/month |

> **Note:** "Unlimited" is never used technically. All plans have enforced caps. Marketing copy uses "high-limit under fair usage policy" for Pro.

---

## Security Architecture

- ✅ All AI provider API keys are server-side only (never in client code)
- ✅ All AI provider calls happen in server API routes
- ✅ Stripe subscription status updated **only** via verified webhook
- ✅ Stripe signature verified on every webhook request
- ✅ JWT verified on every protected route
- ✅ Row Level Security (RLS) on all Supabase tables
- ✅ Input validation with Zod
- ✅ Usage rate limiting enforced server-side
- ✅ Timeout on every AI provider call
- ✅ `Promise.allSettled` — one provider failure never crashes the whole request
- ✅ Errors stored per provider in DB
- ✅ Judge output parsed safely with fallback

---

## Cost Estimates (per query, 5 models + judge)

| Component | Approx. cost |
|---|---|
| OpenAI gpt-4o-mini | ~$0.0002 |
| Claude claude-3-haiku | ~$0.0003 |
| Gemini 1.5 Flash | ~$0.0001 |
| Perplexity sonar-small | ~$0.0003 |
| Llama via Groq | ~$0.0004 |
| Judge (claude-3-5-sonnet) | ~$0.003 |
| **Total per query** | **~$0.004** |

At Pro (200 queries/day): ~$24/month in AI costs. Price at $19 is loss-leading initially — adjust models or pricing accordingly.

---

## Development Notes

### Switching to higher-quality models

Edit these constants in the service files:

```typescript
// lib/services/openai.ts
const MODEL = 'gpt-4o'; // was gpt-4o-mini

// lib/services/claude.ts
const MODEL = 'claude-3-5-sonnet-20241022'; // was claude-3-haiku

// lib/services/gemini.ts
const MODEL = 'gemini-1.5-pro'; // was gemini-1.5-flash
```

### Running the type checker

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

---

## What's Not Included (Future Roadmap)

- [ ] PDF export of results
- [ ] Team/workspace sharing
- [ ] API access for Pro Max
- [ ] Email notifications
- [ ] Custom model selection per query
- [ ] Saved/bookmarked queries
- [ ] Browser extension

---

## License

MIT

---

## Support

Contact: [hello@multiai.app](mailto:hello@multiai.app)
