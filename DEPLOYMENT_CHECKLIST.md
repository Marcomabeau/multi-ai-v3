# MULTI Ai — Production Deployment Checklist

Run through every item before going live.

---

## 1. Supabase Setup

- [ ] Create Supabase project at supabase.com
- [ ] Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
- [ ] Run `supabase/migrations/002_atomic_usage_rpc.sql` in SQL Editor
- [ ] Confirm `increment_usage_atomic` function exists under Database → Functions
- [ ] Set Site URL in Auth → URL Configuration → `https://yourdomain.com`
- [ ] Set Redirect URLs: `https://yourdomain.com/**`
- [ ] Enable Email provider in Auth → Providers
- [ ] Copy: Project URL, Anon Key, Service Role Key

## 2. AI Provider Keys

| Provider | Console | Key prefix |
|---|---|---|
| OpenAI | platform.openai.com/api-keys | `sk-...` |
| Anthropic | console.anthropic.com | `sk-ant-...` |
| Google Gemini | aistudio.google.com/apikey | `AIza...` |
| Perplexity | perplexity.ai/settings/api | `pplx-...` |
| Groq (Llama) | console.groq.com/keys | `gsk_...` |

- [ ] All 5 keys obtained and funded

## 3. Stripe Setup

- [ ] Create account at stripe.com (use Test mode first)
- [ ] Create product: **MULTI Ai Pro** → $19/month → copy Price ID
- [ ] Create product: **MULTI Ai Pro Max** → $49/month → copy Price ID
- [ ] Note Secret Key (`sk_live_...` or `sk_test_...`)
- [ ] Install Stripe CLI for local webhook testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe-webhook
  ```
- [ ] For production: create webhook in Stripe Dashboard
  - URL: `https://yourdomain.com/api/stripe-webhook`
  - Events:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
  - Copy Signing Secret (`whsec_...`)

## 4. Environment Variables

All must be set in Vercel (Settings → Environment Variables):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Providers (server only — never NEXT_PUBLIC_)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
GROQ_API_KEY=gsk_...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PRO_MAX_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # optional
```

- [ ] All variables set in Vercel
- [ ] NONE of the server keys have `NEXT_PUBLIC_` prefix
- [ ] `.env.local` is in `.gitignore` and NOT committed

## 5. Pre-deploy Build Verification

```bash
npm ci
npm run type-check      # must pass with 0 errors
npm run lint            # must pass with 0 errors
npm test                # all tests must pass
npm run build           # must complete successfully
```

- [ ] `type-check` passes
- [ ] `lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds

## 6. Vercel Deploy

```bash
npm i -g vercel
vercel --prod
```

- [ ] Deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] Vercel environment variables match section 4

## 7. Post-deploy Verification

- [ ] Landing page loads at `https://yourdomain.com`
- [ ] Sign up with a real email works
- [ ] Confirmation email received and link works
- [ ] Can log in after confirming email
- [ ] Free user: 2 questions allowed, 3rd is blocked with modal
- [ ] Usage limit modal shows correct reset time
- [ ] Stripe checkout opens (test mode: use card `4242 4242 4242 4242`)
- [ ] After checkout: profile plan updated to `pro` (check Supabase)
- [ ] Pro user: 200 question limit enforced
- [ ] Stripe webhook: go to Stripe Dashboard → Webhooks → check delivery log
- [ ] `/terms` and `/privacy` pages load
- [ ] Dark mode toggle works and persists
- [ ] Mobile layout renders correctly
- [ ] `X-Frame-Options: SAMEORIGIN` header present (check browser DevTools → Network)

## 8. Monitoring (Recommended before launch)

- [ ] Set up [Sentry](https://sentry.io) for error tracking:
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs
  ```
- [ ] Set up uptime monitoring (e.g. Better Uptime, Checkly)
- [ ] Enable Vercel Analytics (free tier)
- [ ] Set Stripe billing alerts for unusual spend
- [ ] Set OpenAI/Anthropic/Gemini spend limits in respective dashboards

## 9. AI Cost Controls (Before High Traffic)

Each provider has a monthly spend cap in their dashboard:
- [ ] OpenAI: set usage limit at platform.openai.com/account/limits
- [ ] Anthropic: set limit at console.anthropic.com/settings/limits
- [ ] Gemini: set quota at console.cloud.google.com
- [ ] Perplexity: set limit at perplexity.ai/settings/api
- [ ] Groq: set limit at console.groq.com

**Estimated cost per query (all 5 models + judge): ~$0.004**
At 200 Pro queries/day × 100 users = $80/day = ~$2,400/month in AI costs.
Price your plans accordingly.

## 10. Security Final Check

- [ ] Run `npm audit` — fix any high/critical vulnerabilities
- [ ] No secrets in git history (`git log --all -S "sk-" --source` should return nothing)
- [ ] Supabase RLS is enabled on all tables (verified in Table Editor)
- [ ] Stripe webhook signature verification is active
- [ ] Rate limiting is enforced via atomic RPC (not application-level only)

---

**When all boxes are checked: you are production-ready.**
