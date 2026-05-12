import { NextResponse } from 'next/server';

import { addChatHistoryMessage, getChatHistoryForUser } from '@/backend/chat-history-store';

const DEFAULT_USER_ID = 'default-user';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId')?.trim() || DEFAULT_USER_ID;

    const messages = await getChatHistoryForUser(userId);

    return NextResponse.json({
      messages,
      retentionDays: 7,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load chat history.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      message?: string;
      attachments?: unknown;
    };

    const userId = body.userId?.trim() || DEFAULT_USER_ID;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 }
      );
    }

    const attachments = Array.isArray(body.attachments)
      ? body.attachments.filter((item): item is string => typeof item === 'string')
      : [];

    const item = await addChatHistoryMessage({
      userId,
      message,
      attachments,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to store chat history.' },
      { status: 500 }
    );
  }
}
