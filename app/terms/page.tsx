import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: {new Date().getFullYear()}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using MULTI Ai ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">2. Description of Service</h2>
            <p>MULTI Ai is a SaaS platform that queries multiple AI models in parallel and uses an AI Judge to synthesize a best-supported answer. We do not guarantee the accuracy, completeness, or fitness of any answer for any purpose. AI-generated content may be incorrect.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">3. Account Registration</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your credentials. You must be at least 13 years old to use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Generate harmful, illegal, or deceptive content</li>
              <li>Attempt to circumvent usage limits or security controls</li>
              <li>Reverse engineer or resell the Service without authorisation</li>
              <li>Violate any applicable law or third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">5. Subscription and Billing</h2>
            <p>Paid plans are billed in advance on a monthly basis. Subscriptions auto-renew unless cancelled. Refunds are issued at our discretion. We reserve the right to change pricing with 30 days notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">6. Limitation of Liability</h2>
            <p>The Service is provided "as is." To the fullest extent permitted by law, MULTI Ai shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">7. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these terms or for any other reason with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">8. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance. We will notify active subscribers of material changes by email.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">9. Contact</h2>
            <p>For questions about these terms: <a href="mailto:hello@multiai.app" className="text-blue-500 hover:text-blue-600">hello@multiai.app</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
