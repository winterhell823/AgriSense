import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface ChatHistoryMessage {
  id: string;
  userId: string;
  message: string;
  attachments: string[];
  createdAt: string;
}

interface ChatHistoryDb {
  messages: ChatHistoryMessage[];
}

const RETENTION_DAYS = 7;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const DATA_FILE = path.join(DATA_DIR, 'chat-history.json');

const EMPTY_DB: ChatHistoryDb = { messages: [] };

function isWithinRetention(createdAt: string, now: number) {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return now - parsed <= RETENTION_MS;
}

function pruneExpired(messages: ChatHistoryMessage[], now: number) {
  return messages.filter((item) => isWithinRetention(item.createdAt, now));
}

async function ensureDataFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, 'utf8');
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureDataFile();

  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as ChatHistoryDb;

    if (!Array.isArray(parsed.messages)) {
      return { ...EMPTY_DB };
    }

    return parsed;
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDb(db: ChatHistoryDb) {
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getChatHistoryForUser(userId: string) {
  const now = Date.now();
  const db = await readDb();
  const cleaned = pruneExpired(db.messages, now);

  if (cleaned.length !== db.messages.length) {
    await writeDb({ messages: cleaned });
  }

  return cleaned
    .filter((item) => item.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function addChatHistoryMessage(input: {
  userId: string;
  message: string;
  attachments?: string[];
}) {
  const now = Date.now();
  const db = await readDb();
  const cleaned = pruneExpired(db.messages, now);

  const nextItem: ChatHistoryMessage = {
    id: buildId(),
    userId: input.userId,
    message: input.message,
    attachments: input.attachments ?? [],
    createdAt: new Date(now).toISOString(),
  };

  cleaned.push(nextItem);
  await writeDb({ messages: cleaned });

  return nextItem;
}
