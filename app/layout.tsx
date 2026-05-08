import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: {
    default: 'MULTI Ai — Best Verified Answer from Multiple AI Models',
    template: '%s | MULTI Ai',
  },
  description:
    'Ask once. Get answers from OpenAI, Claude, Gemini, Perplexity, and Llama. Our AI Judge verifies them all and returns the best-supported answer with confidence score and source trail.',
  keywords: ['AI', 'multi-model', 'fact-checking', 'verified answers', 'Claude', 'ChatGPT', 'Gemini'],
  openGraph: {
    title: 'MULTI Ai — Best Verified Answer from Multiple AI Models',
    description: 'Compare multiple leading AI models. Get the best-verified answer with confidence score.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white dark:bg-[#0b0b0c] text-gray-900 dark:text-[#f5f5dc] transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
