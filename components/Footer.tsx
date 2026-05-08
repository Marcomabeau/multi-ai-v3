import Link from 'next/link';
import { Layers } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-[#1a1a1e] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold mb-3">
              <div className="w-6 h-6 rounded-md brand-gradient flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="brand-gradient-text">MULTI Ai</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Best verified answer from multiple AI models.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/app" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Ask a question</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Pricing</Link></li>
              <li><Link href="/history" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">History</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Sign in</Link></li>
              <li><Link href="/login?mode=signup" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Sign up</Link></li>
              <li><Link href="/settings" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Settings</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc] mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Terms of Service</Link></li>
              <li><a href="mailto:hello@multiai.app" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-[#1a1a1e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} MULTI Ai. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            AI answers may be incorrect. Always verify important information.
          </p>
        </div>
      </div>
    </footer>
  );
}
