import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Leaf, ScanSearch, Sparkles, MessageCircleMore, ShieldCheck, Tractor, BrainCircuit } from 'lucide-react';

import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import { Button } from '@/components/ui/button';

const heroImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80';
const heroBackground = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80';

const featureCards = [
  {
    icon: ScanSearch,
    title: 'AI Disease Detection',
    description: 'Snap a crop photo and get a fast, explainable diagnosis powered by a PyTorch-based model.',
  },
  {
    icon: Leaf,
    title: 'Agri-Knowledge Hub',
    description: 'Find short, practical guidance on irrigation, soil care, pest management, and seasonal planning.',
  },
  {
    icon: MessageCircleMore,
    title: 'Agri-Chatbot',
    description: 'Ask plain-language farming questions and receive instant answers tailored to your field situation.',
  },
];

const stats = [
  { label: 'diagnostic flow', value: '1 tap' },
  { label: 'actionable tips', value: '24/7' },
  { label: 'guided chat support', value: 'Always on' },
];

const toolHighlights = [
  'Crop health summaries with confidence levels',
  'Seasonal recommendations for water, soil, and fertilizers',
  'Field notes and previous diagnoses stored in one place',
];

export default function HomePage() {
  return (
    <main className='overflow-hidden pb-24 pt-28 md:pt-32'>
      <ScrollExpandMedia
        mediaType='image'
        mediaSrc={heroImage}
        bgImageSrc={heroBackground}
        title='AgriSense AI-Powered Farming Companion'
        date='Precision farming for modern growers'
        scrollToExpand='Scroll to explore the field view'
        textBlend
      >
        <section className='mx-auto max-w-7xl space-y-10 px-4 md:px-6'>
          <div className='grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end'>
            <div className='space-y-6 rounded-[2rem] border border-white/10 bg-white/7 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10'>
              <div className='inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary'>
                <Sparkles className='h-4 w-4' />
                Built for crop decisions
              </div>
              <div className='space-y-4'>
                <h2 className='max-w-3xl text-4xl font-bold text-white md:text-6xl'>
                  Smarter farming starts with better timing, clearer signals, and faster action.
                </h2>
                <p className='max-w-2xl text-base leading-7 text-white/70 md:text-lg'>
                  AgriSense brings disease detection, practical agronomy guidance, and a specialized AI assistant into one mobile experience for farmers.
                </p>
              </div>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <Button asChild size='lg'>
                  <Link href='/chat'>
                    Open Agri-Chatbot
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
                <Button asChild size='lg' variant='outline'>
                  <Link href='/ai-model'>Inspect AI Model</Link>
                </Button>
              </div>
            </div>

            <div className='grid gap-4 rounded-[2rem] border border-white/10 bg-[#0c1511]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl'>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-full bg-primary/15 p-3 text-primary'>
                    <ShieldCheck className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-white'>Trusted guidance</p>
                    <p className='text-sm text-white/55'>Practical recommendations over generic advice.</p>
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-3 gap-3'>
                {stats.map(stat => (
                  <div key={stat.label} className='rounded-2xl border border-white/10 bg-white/5 p-4 text-center'>
                    <p className='text-lg font-bold text-white'>{stat.value}</p>
                    <p className='mt-1 text-xs uppercase tracking-[0.22em] text-white/45'>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='grid gap-5 md:grid-cols-3'>
            {featureCards.map(card => {
              const Icon = card.icon;
              return (
                <article key={card.title} className='group rounded-[1.75rem] border border-white/10 bg-white/6 p-6 shadow-xl shadow-black/20 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary transition group-hover:bg-primary group-hover:text-white'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <h3 className='mt-5 text-2xl font-semibold text-white'>{card.title}</h3>
                  <p className='mt-3 text-sm leading-7 text-white/65'>{card.description}</p>
                </article>
              );
            })}
          </div>

          <div className='grid gap-6 lg:grid-cols-[0.8fr_1.2fr]'>
            <div className='rounded-[2rem] border border-white/10 bg-[#101914]/85 p-8 shadow-2xl shadow-black/20'>
              <div className='flex items-center gap-3 text-primary'>
                <Tractor className='h-5 w-5' />
                <span className='text-xs font-semibold uppercase tracking-[0.3em]'>Field workflow</span>
              </div>
              <h3 className='mt-4 text-3xl font-semibold text-white'>One app, three daily jobs</h3>
              <ul className='mt-6 space-y-4 text-sm leading-7 text-white/70'>
                {toolHighlights.map(item => (
                  <li key={item} className='flex gap-3'>
                    <span className='mt-2 h-2 w-2 rounded-full bg-accent' />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20'>
              <div className='relative min-h-[320px]'>
                <Image
                  src='https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80'
                  alt='Farm landscape'
                  fill
                  className='object-cover'
                  priority={false}
                />
                <div className='absolute inset-0 bg-gradient-to-tr from-[#07100b]/90 via-[#07100b]/45 to-transparent' />
                <div className='absolute inset-x-0 bottom-0 p-6 md:p-8'>
                  <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80'>
                    <BrainCircuit className='h-4 w-4 text-accent' />
                    Intelligent field companion
                  </div>
                  <h3 className='mt-4 max-w-xl text-3xl font-semibold text-white md:text-4xl'>
                    Designed for farmers who need fast answers, not more noise.
                  </h3>
                  <p className='mt-3 max-w-2xl text-sm leading-7 text-white/72'>
                    Capture a symptom, ask a question, revisit history, and keep your profile centered on the crops you actually manage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollExpandMedia>
    </main>
  );
}
