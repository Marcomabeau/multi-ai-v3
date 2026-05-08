import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: {new Date().getFullYear()}</p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">1. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> email address, hashed password (via Supabase Auth)</li>
              <li><strong>Query data:</strong> questions you submit, AI model responses, judge results</li>
              <li><strong>Usage data:</strong> query counts, timestamps, latency</li>
              <li><strong>Billing data:</strong> Stripe customer ID and subscription status (we never store raw card data)</li>
              <li><strong>Analytics:</strong> page views and events via Google Analytics 4 (anonymised)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the Service</li>
              <li>To enforce usage limits and manage subscriptions</li>
              <li>To display your query history</li>
              <li>To send transactional emails (account confirmation, billing receipts)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">3. Third-Party Services</h2>
            <p>Your questions are sent to third-party AI providers (OpenAI, Anthropic, Google, Perplexity, Groq) to generate answers. Each provider has their own privacy policy and data retention terms. We recommend not submitting personally sensitive information in queries.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">4. Data Retention</h2>
            <p>Free plan query history is retained for 7 days. Pro plan history is retained for 90 days. Pro Max retains indefinitely. Account data is retained until you delete your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">5. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:hello@multiai.app" className="text-blue-500 hover:text-blue-600">hello@multiai.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">6. Cookies</h2>
            <p>We use cookies strictly for authentication session management (via Supabase) and analytics (via Google Analytics 4). No advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">7. Security</h2>
            <p>All data is encrypted in transit (TLS) and at rest. API keys are stored server-side only and never exposed to clients. Row Level Security is enforced at the database layer.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">8. Contact</h2>
            <p>Privacy questions: <a href="mailto:hello@multiai.app" className="text-blue-500 hover:text-blue-600">hello@multiai.app</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
