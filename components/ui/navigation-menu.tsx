"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Leaf, MessageSquare, Bot, History, UserRound, House } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { name: 'home', href: '/', icon: House },
  { name: 'chat', href: '/chat', icon: MessageSquare },
  { name: 'ai model', href: '/ai-model', icon: Bot },
  { name: 'history', href: '/chat-history', icon: History },
  { name: 'profile', href: '/profile', icon: UserRound },
];

const containerVariants = {
  expanded: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
      staggerChildren: 0.04,
      delayChildren: 0.06,
    },
  },
} satisfies Variants;

const logoVariants = {
  expanded: { opacity: 1, x: 0, transition: { type: 'spring', damping: 15 } },
} satisfies Variants;

const itemVariants = {
  expanded: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', damping: 16 } },
} satisfies Variants;

export function AnimatedNavFramer() {
  const pathname = usePathname();

  return (
    <div className='sticky top-0 z-[9999] px-3 pt-3 md:px-6 md:pt-5'>
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate='expanded'
        variants={containerVariants}
        className='mx-auto flex w-full max-w-6xl items-center justify-between gap-2 overflow-x-auto rounded-full border border-white/15 bg-[#07100c]/98 px-3 py-2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl'
      >
        <motion.div variants={logoVariants} className='flex shrink-0 items-center gap-2 pr-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary'>
            <Leaf className='h-4 w-4' />
          </div>
          <div className='hidden flex-col leading-none sm:flex'>
            <span className='text-[10px] uppercase tracking-[0.3em] text-white/50'>AgriSense</span>
            <span className='text-sm font-semibold text-white'>Farming companion</span>
          </div>
        </motion.div>

        <div className='flex min-w-max items-center gap-1 sm:gap-2'>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <motion.div key={item.name} variants={itemVariants}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold capitalize transition-all duration-200 sm:text-sm',
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'bg-white/6 text-white/88 hover:bg-white/14 hover:text-white'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  <span className='whitespace-nowrap'>{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
