'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils/helpers';
import { Send, Loader2 } from 'lucide-react';

interface Props {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_CHARS = 8000;

const EXAMPLE_QUESTIONS = [
  'What is the most effective treatment for lower back pain?',
  'How does quantum computing differ from classical computing?',
  'What are the pros and cons of intermittent fasting?',
  'Is climate change primarily caused by human activity?',
];

export function QueryInput({ onSubmit, isLoading, disabled, placeholder }: Props) {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length < 3 || isLoading || disabled) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExample = (q: string) => {
    setQuestion(q);
    textareaRef.current?.focus();
  };

  const remaining = MAX_CHARS - question.length;
  const isNearLimit = remaining < 200;

  return (
    <div className="space-y-4">
      {/* Textarea input */}
      <div
        className={cn(
          'card card-shadow overflow-hidden transition-all duration-200',
          !disabled && 'hover:shadow-card-hover dark:hover:shadow-card-dark'
        )}
      >
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          maxLength={MAX_CHARS}
          rows={4}
          placeholder={placeholder ?? 'Ask anything — our AI Judge will verify the best answer across 5 models...'}
          className={cn(
            'w-full px-5 pt-5 pb-3 text-base bg-transparent text-gray-900 dark:text-[#f5f5dc] placeholder-gray-400 dark:placeholder-gray-600 outline-none resize-none leading-relaxed',
            (isLoading || disabled) && 'opacity-50 cursor-not-allowed'
          )}
        />
        <div className="flex items-center justify-between px-5 pb-4">
          <span
            className={cn(
              'text-xs transition-colors',
              isNearLimit ? 'text-amber-500' : 'text-gray-400 dark:text-gray-600'
            )}
          >
            {question.length > 0 && `${question.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`}
          </span>
          <div className="flex items-center gap-2">
            {question.trim().length > 0 && (
              <button
                onClick={() => setQuestion('')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-1"
                disabled={isLoading}
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isLoading || disabled || question.trim().length < 3}
              className={cn(
                'btn-primary px-4 py-2 text-sm',
                (isLoading || disabled || question.trim().length < 3) && 'opacity-50 cursor-not-allowed transform-none shadow-none'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Example questions */}
      {question.length === 0 && !isLoading && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleExample(q)}
                disabled={disabled}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#2a2a2e] text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
              >
                {q.slice(0, 50)}...
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
