import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PricingCards } from '@/components/PricingCards';

export const metadata = {
  title: 'Pricing',
  description: 'Simple pricing for MULTI Ai — start free, upgrade for full verification power.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Start free. Upgrade when you need more verification power, deeper source trails, and higher limits.
            </p>
          </div>

          <PricingCards />

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-600">
              All plans include honest AI-verified answers — never inflated claims. Pro plans enforce a fair usage cap, not technically unlimited access.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
              Questions? <a href="mailto:hello@multiai.app" className="text-blue-500 hover:text-blue-600">Contact us</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
