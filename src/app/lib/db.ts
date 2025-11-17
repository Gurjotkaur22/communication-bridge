// src/lib/db.ts
import { openDB, IDBPDatabase } from 'idb';

export type Settings = { lang: string; voiceId: string; volume: number };

export type PhraseRec = { id: string; text: string; createdAt: number };

export type PecsRec = {
  id: string;
  label: string;
  phrase?: string;
  imageDataURL?: string;  // stored image as data URL
  audioBlobURL?: string;  // optional (recorded audio), later phase
  createdAt: number;
};

type DBSchema = {
  settings: { key: 'singleton'; value: Settings };
  phrases:  { key: string; value: PhraseRec };
  pecs:     { key: string; value: PecsRec };
};

let dbPromise: Promise<IDBPDatabase<DBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<DBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DBSchema>('commbridge', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        if (!db.objectStoreNames.contains('phrases'))  db.createObjectStore('phrases', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('pecs'))     db.createObjectStore('pecs', { keyPath: 'id' });
      }
    });
  }
  return dbPromise;
}

// SETTINGS
export async function loadSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  // IDB returns undefined when the key is not present
  return db.get('settings', 'singleton');
}

export async function saveSettings(s: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', s, 'singleton');
}

// PHRASES (for later phases)
export async function listPhrases(): Promise<PhraseRec[]> {
  const db = await getDB();
  const store = db.transaction('phrases').store;
  const out: PhraseRec[] = [];
  let cur = await store.openCursor();
  while (cur) {
    out.push(cur.value);
    cur = await cur.continue();
  }
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

export async function upsertPhrase(text: string, id = crypto.randomUUID()): Promise<string> {
  const db = await getDB();
  await db.put('phrases', { id, text, createdAt: Date.now() });
  return id;
}

export async function deletePhrase(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('phrases', id);
}

// PECS (for later phases)
export async function listPecs(): Promise<PecsRec[]> {
  const db = await getDB();
  const store = db.transaction('pecs').store;
  const out: PecsRec[] = [];
  let cur = await store.openCursor();
  while (cur) {
    out.push(cur.value);
    cur = await cur.continue();
  }
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

export async function upsertPecs(card: Partial<PecsRec> & { label: string }): Promise<string> {
  const db = await getDB();
  const id = card.id ?? crypto.randomUUID();
  await db.put('pecs', {
    id,
    label: card.label,
    phrase: card.phrase ?? '',
    imageDataURL: card.imageDataURL ?? '',
    audioBlobURL: card.audioBlobURL ?? '',
    createdAt: Date.now()
  });
  return id;
}

export async function deletePecs(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pecs', id);
}