import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Manrope, Space_Grotesk } from 'next/font/google';

import { AnimatedNavFramer } from '@/components/ui/navigation-menu';
import { AgriSenseFooter } from '@/components/ui/footer';
import './globals.css';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgriSense',
  description: 'AI-powered farming companion for crop health, knowledge, and support.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en'>
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <AnimatedNavFramer />
        <div className="min-h-[calc(100vh-72px)]">
          {children}
        </div>
        <AgriSenseFooter />
      </body>
    </html>
  );
}
