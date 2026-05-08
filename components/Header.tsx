'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils/helpers';
import { Layers, Menu, X } from 'lucide-react';

export function Header() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navLinks = user
    ? [
        { href: '/app', label: 'Ask' },
        { href: '/history', label: 'History' },
        { href: '/settings', label: 'Settings' },
      ]
    : [
        { href: '/#features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
      ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b0b0c]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#1a1a1e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="brand-gradient-text">MULTI Ai</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors',
                  pathname === link.href
                    ? 'text-blue-500 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400 max-w-[140px] truncate">
                    {user.email}
                  </span>
                  <button onClick={handleSignOut} className="btn-secondary text-sm px-4 py-2">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                    Sign in
                  </Link>
                  <Link href="/login?mode=signup" className="btn-primary">
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1e]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 dark:border-[#1a1a1e] mt-0 pt-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm transition-colors',
                  pathname === link.href
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1e]'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <button onClick={handleSignOut} className="btn-secondary text-sm w-full">
                  Sign out
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-sm text-center">
                    Sign in
                  </Link>
                  <Link href="/login?mode=signup" onClick={() => setMobileOpen(false)} className="btn-primary text-center">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
