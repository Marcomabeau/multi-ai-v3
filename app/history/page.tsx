'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { formatDate, formatDuration } from '@/lib/utils/helpers';
import type { Query } from '@/types';
import type { User } from '@supabase/supabase-js';
import { Clock, ChevronRight, Search } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthGuard>
        {(_user: User) => <HistoryContent />}
      </AuthGuard>
      <Footer />
    </div>
  );
}

function HistoryContent() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data: { queries: Query[] }) => {
        setQueries(data.queries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = queries.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5dc]">Query history</h1>
        <Link href="/app" className="btn-primary text-sm">Ask new question</Link>
      </div>

      {queries.length > 5 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your questions..."
            className="input-base pl-10"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card card-shadow p-4 animate-pulse">
              <div className="skeleton h-4 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#1a1a1e] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {search ? 'No matching questions' : 'No questions yet'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {search ? 'Try a different search term.' : 'Your verified answers will appear here.'}
          </p>
          {!search && <Link href="/app" className="btn-primary">Ask your first question</Link>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <div key={q.id} className="card card-shadow p-4 flex items-start gap-4 hover:border-gray-300 dark:hover:border-[#2a2a2e] transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-[#f5f5dc] line-clamp-2 mb-2">{q.question}</p>
                {q.final_answer && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{q.final_answer}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {q.confidence_score != null && <ConfidenceBadge score={q.confidence_score} size="sm" />}
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
                    <Clock className="w-3 h-3" />
                    {formatDate(q.created_at)}
                  </span>
                  {q.latency_ms != null && (
                    <span className="text-xs text-gray-400 dark:text-gray-600">{formatDuration(q.latency_ms)}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    q.status === 'complete' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : q.status === 'error' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                    : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1e]'
                  }`}>{q.status}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 flex-shrink-0 mt-1 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
