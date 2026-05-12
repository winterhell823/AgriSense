import type { ReactNode } from 'react';
import Link from 'next/link';
import { Facebook, Github, Instagram, Leaf, Linkedin, Twitter } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface FooterProps {
  logo: ReactNode;
  brandName: string;
  socialLinks: Array<{
    icon: ReactNode;
    href: string;
    label: string;
  }>;
  mainLinks: Array<{
    href: string;
    label: string;
  }>;
  legalLinks: Array<{
    href: string;
    label: string;
  }>;
  copyright: {
    text: string;
    license?: string;
  };
}

export function Footer({
  logo,
  brandName,
  socialLinks,
  mainLinks,
  legalLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#07100c] pb-6 pt-16 text-white lg:pb-8 lg:pt-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
          <div className="md:flex md:items-start md:justify-between">
            <Link
              href="/"
              className="flex items-center gap-x-3"
              aria-label={brandName}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary shadow-glow">
                {logo}
              </span>
              <span className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {brandName}
              </span>
            </Link>
            <ul className="mt-6 flex list-none space-x-3 md:mt-0">
              {socialLinks.map((link, i) => (
                <li key={i}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full border-white/10 bg-white/5 text-white hover:bg-primary hover:text-primary-foreground"
                    asChild
                  >
                    <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                      {link.icon}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6 md:mt-8 lg:grid lg:grid-cols-10">
            <nav className="lg:col-[4/11] lg:mt-0">
              <ul className="-my-1 -mx-2 flex list-none flex-wrap lg:justify-end">
                {mainLinks.map((link, i) => (
                  <li key={i} className="my-1 mx-2 shrink-0">
                    <Link
                      href={link.href}
                      className="text-sm text-white/78 underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-6 text-sm leading-6 text-white/55 whitespace-nowrap lg:col-[1/4] lg:row-[1/3] lg:mt-0">
              <div>{copyright.text}</div>
              {copyright.license && <div>{copyright.license}</div>}
            </div>
            <div className="mt-6 lg:col-[4/11] lg:mt-0">
              <ul className="-my-1 -mx-3 flex list-none flex-wrap lg:justify-end">
                {legalLinks.map((link, i) => (
                  <li key={i} className="my-1 mx-3 shrink-0">
                    <Link
                      href={link.href}
                      className="text-sm text-white/55 underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function AgriSenseFooter() {
  return (
    <Footer
      logo={<Leaf className="h-5 w-5" />}
      brandName="AgriSense"
      socialLinks={[
        { icon: <Twitter className="h-5 w-5" />, href: 'https://twitter.com', label: 'Twitter' },
        { icon: <Github className="h-5 w-5" />, href: 'https://github.com', label: 'GitHub' },
        { icon: <Instagram className="h-5 w-5" />, href: 'https://instagram.com', label: 'Instagram' },
        { icon: <Linkedin className="h-5 w-5" />, href: 'https://linkedin.com', label: 'LinkedIn' },
        { icon: <Facebook className="h-5 w-5" />, href: 'https://facebook.com', label: 'Facebook' },
      ]}
      mainLinks={[
        { href: '/', label: 'Home' },
        { href: '/chat', label: 'Chat' },
        { href: '/ai-model', label: 'AI Model' },
        { href: '/chat-history', label: 'History' },
      ]}
      legalLinks={[
        { href: '/profile', label: 'Profile' },
        { href: '/privacy', label: 'Privacy' },
        { href: '/terms', label: 'Terms' },
      ]}
      copyright={{
        text: '© 2026 AgriSense',
        license: 'All rights reserved',
      }}
    />
  );
}
