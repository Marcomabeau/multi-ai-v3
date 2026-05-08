import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, Zap, Shield, Brain, Globe, ArrowRight } from 'lucide-react';

const PROVIDERS = ['OpenAI', 'Gemini', 'Claude', 'Perplexity', 'Llama'];

const FEATURES = [
  {
    icon: Brain,
    title: 'Multi-Model Intelligence',
    description: 'Your question goes to 5 leading AI models simultaneously, capturing the best knowledge from each.',
  },
  {
    icon: Shield,
    title: 'AI Judge Verification',
    description: 'A sixth AI model acts as judge — cross-checking answers, identifying contradictions, and scoring confidence.',
  },
  {
    icon: Globe,
    title: 'Web-Grounded Sources',
    description: 'Perplexity provides real-time web citations. The judge uses source-backed evidence over model consensus.',
  },
  {
    icon: Zap,
    title: 'Confidence Scoring',
    description: 'Every answer includes a 0–100 confidence score with clear reasoning — no false certainty.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative px-4 sm:px-6 pt-20 pb-24 text-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-hero-light dark:bg-hero-dark pointer-events-none" />

          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-medium mb-8">
              <Zap className="w-3 h-3" />
              5 AI models + 1 Judge = Verified answers
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-[#f5f5dc] leading-tight mb-6">
              Compare multiple AI.{' '}
              <span className="brand-gradient-text">Verify the facts.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Ask once. Get answers from 5 leading AI models. Our AI Judge cross-checks them all and returns the best-supported answer — with confidence score and source trail.
            </p>

            {/* Provider pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {PROVIDERS.map((name) => (
                <span
                  key={name}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-[#2a2a2e] text-gray-600 dark:text-gray-400 bg-white dark:bg-[#121214]"
                >
                  {name}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                + AI Judge
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/app" className="btn-primary text-base px-6 py-3 justify-center">
                Start asking — it's free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="btn-secondary text-base px-6 py-3 justify-center">
                View pricing
              </Link>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
              2 free questions per 2 hours. No credit card required.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 sm:px-6 py-20 border-t border-gray-100 dark:border-[#1a1a1e]" id="features">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-4">
                How MULTI Ai works
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                One question, five models, one verified answer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="card card-shadow p-6 flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl brand-gradient flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-[#f5f5dc] mb-1.5">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* What MULTI Ai is NOT */}
        <section className="px-4 sm:px-6 py-16 bg-gray-50 dark:bg-[#0e0e10]">
          <div className="max-w-3xl mx-auto">
            <div className="card card-shadow p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-4">
                Honest by design
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                MULTI Ai does <strong className="text-gray-700 dark:text-gray-300">not</strong> claim to give 100% truth. No AI system can. We give you the{' '}
                <strong className="text-blue-600 dark:text-blue-400">best-supported</strong>,{' '}
                <strong className="text-blue-600 dark:text-blue-400">best-verified</strong> answer based on the available evidence — with full transparency on where it came from and how confident the system is.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  { icon: '✓', text: 'Cross-verified across 5 models', good: true },
                  { icon: '✓', text: 'Confidence score 0–100', good: true },
                  { icon: '✓', text: 'Source trail from the web', good: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-emerald-500 font-bold">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-4">
              Stop trusting one AI.{' '}
              <span className="brand-gradient-text">Verify with five.</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Start for free. No credit card required.
            </p>
            <Link href="/app" className="btn-primary text-base px-8 py-3 justify-center inline-flex">
              Ask your first question
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
