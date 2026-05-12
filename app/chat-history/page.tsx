"use client";

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, History, Search, Star } from 'lucide-react';

type ChatHistoryMessage = {
  id: string;
  userId: string;
  message: string;
  attachments: string[];
  createdAt: string;
};

function formatDateLabel(isoDate: string) {
  const timestamp = new Date(isoDate);
  const now = new Date();

  const isSameDay = timestamp.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = timestamp.toDateString() === yesterday.toDateString();

  const timeText = timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isSameDay) {
    return `Today · ${timeText}`;
  }

  if (isYesterday) {
    return `Yesterday · ${timeText}`;
  }

  const dateText = timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateText} · ${timeText}`;
}

export default function ChatHistoryPage() {
  const [items, setItems] = useState<ChatHistoryMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const response = await fetch('/api/chat-history?userId=default-user', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Failed to load history');
        }

        const data = (await response.json()) as { messages?: ChatHistoryMessage[] };

        if (isMounted) {
          setItems(Array.isArray(data.messages) ? data.messages : []);
          setLoadError(null);
        }
      } catch {
        if (isMounted) {
          setLoadError('Unable to load chat history right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const weeklyCountLabel = useMemo(() => {
    return `${items.length} conversation${items.length === 1 ? '' : 's'} in the last 7 days`;
  }, [items.length]);

  return (
    <main className='mx-auto min-h-screen max-w-7xl px-4 pb-12 pt-28 md:px-6'>
      <div className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
        <section className='rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl'>
          <div className='flex items-center gap-3 text-primary'>
            <History className='h-5 w-5' />
            <p className='text-xs uppercase tracking-[0.3em]'>Chat history</p>
          </div>
          <h1 className='mt-4 text-4xl font-bold text-white'>
            Revisit advice, decisions, and field context.
          </h1>
          <p className='mt-4 text-sm leading-7 text-white/68'>
            Stored conversations help you continue from where you left off and compare advice across days or seasons.
          </p>

          <div className='mt-8 grid gap-3 sm:grid-cols-2'>
            <div className='rounded-2xl border border-white/10 bg-[#0b1310] p-4 text-sm text-white/68'>
              <div className='flex items-center gap-2 text-primary'>
                <CalendarDays className='h-4 w-4' />
                Recent activity
              </div>
              <p className='mt-2 text-white'>{weeklyCountLabel}</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-[#0b1310] p-4 text-sm text-white/68'>
              <div className='flex items-center gap-2 text-primary'>
                <Star className='h-4 w-4' />
                Retention
              </div>
              <p className='mt-2 text-white'>Messages are auto-kept for 7 days</p>
            </div>
          </div>
        </section>

        <section className='rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/25'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-xs uppercase tracking-[0.3em] text-white/45'>Search records</p>
              <h2 className='mt-2 text-2xl font-semibold text-white'>Find a previous answer quickly</h2>
            </div>
            <div className='flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/55'>
              <Search className='h-4 w-4' />
              <span className='text-sm'>Disease, crop, weather</span>
            </div>
          </div>

          <div className='mt-6 space-y-4'>
            {loading && (
              <article className='rounded-3xl border border-white/10 bg-[#0d1612]/95 p-5 text-sm text-white/68'>
                Loading chat history...
              </article>
            )}

            {!loading && loadError && (
              <article className='rounded-3xl border border-red-500/30 bg-[#0d1612]/95 p-5 text-sm text-red-200'>
                {loadError}
              </article>
            )}

            {!loading && !loadError && items.length === 0 && (
              <article className='rounded-3xl border border-white/10 bg-[#0d1612]/95 p-5 text-sm text-white/68'>
                No chats yet. Start a conversation in the chat tab and it will appear here.
              </article>
            )}

            {!loading && !loadError && items.map((item) => (
              <article key={item.id} className='rounded-3xl border border-white/10 bg-[#0d1612]/95 p-5'>
                <div>
                  <h3 className='text-lg font-semibold text-white'>User message</h3>
                  <p className='mt-1 text-xs uppercase tracking-[0.25em] text-white/35'>
                    {formatDateLabel(item.createdAt)}
                  </p>
                </div>
                <p className='mt-4 whitespace-pre-wrap text-sm leading-7 text-white/75'>{item.message}</p>
                {item.attachments.length > 0 && (
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {item.attachments.map((file) => (
                      <span
                        key={`${item.id}-${file}`}
                        className='rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-xs text-primary'
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
