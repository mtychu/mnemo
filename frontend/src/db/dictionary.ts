/**
 * IndexedDB wrapper for mnemo dictionary and known words.
 * 
 * Two tables (object stores):
 * 1. "entries" - CC-CEDICT dictionary (~125K rows)
 * 2. "knownWords" - Words user has marked as known
 * 
 * This module handles:
 * - Database initialization and schema
 * - One-time dictionary import from JSON
 * - Fast lookups by traditional or simplified characters
 * - Known words management
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * A single dictionary entry (matches our JSON format).
 * Short keys to save space in the 4MB JSON file.
 */
export interface DictEntry {
  t: string;      // traditional characters
  s: string;      // simplified characters  
  p: string;      // pinyin with tone numbers
  d: string[];    // definitions array
}

/**
 * A word the user has marked as "known".
 */
export interface KnownWord {
  word: string;           // The word itself (primary key)
  simplified: string;     // Normalized simplified form
  traditional: string;    // Normalized traditional form
  addedDate: string;      // ISO date string
  source: string;         // How learned: "mnemo", "imported", etc.
}

/**
 * Database schema - tells TypeScript what tables and indexes exist.
 * This is a TypeScript-only construct; it enforces type safety.
 */
interface MnemoDBSchema extends DBSchema {
  entries: {
    key: number;              // Auto-incrementing ID
    value: DictEntry;         // The row data
    indexes: {
      'traditional': string;  // Index for lookup by traditional
      'simplified': string;   // Index for lookup by simplified
    };
  };
  knownWords: {
    key: string;              // The word itself is the key
    value: KnownWord;
    indexes: {
      'simplified': string;
      'traditional': string;
    };
  };
  cards: {
    key: number;
    value: {
      id?: number;
      word: string;
      traditional: string;
      simplified: string;
      pinyin: string;
      definitions: string[];
      nuance?: string;
      collocations?: string[];
      notes?: string;
      exampleSentence?: string;
      exampleTranslation?: string;
      exampleReading?: string;
      userNotes?: string;
      context?: string;
      language: 'zh' | 'ja';
      createdAt: string;
      lastReviewed?: string;
      reviewCount: number;
    };
    indexes: {
      'word': string;
      'createdAt': string;
    };
  };
  meta: {
    key: string;              // Metadata key (e.g., "dictVersion")
    value: string;            // Metadata value
  };
}

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

const DB_NAME = 'mnemo';
const DB_VERSION = 5;  // Added cards store

/**
 * Open (or create) the database.
 * 
 * The upgrade callback runs when:
 * 1. Database doesn't exist yet (first visit)
 * 2. DB_VERSION is higher than what's stored (schema migration)
 */
export async function openMnemoDB(): Promise<IDBPDatabase<MnemoDBSchema>> {
  return openDB<MnemoDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion) {
      // If upgrading from an old version, delete everything and start fresh
      if (oldVersion > 0) {
        for (const name of db.objectStoreNames) {
          db.deleteObjectStore(name);
        }
      }
      
      // Create "entries" table with indexes
      const entriesStore = db.createObjectStore('entries', {
        keyPath: undefined,       // No field as primary key
        autoIncrement: true,      // Generate numeric IDs
      });
      
      // Create indexes for fast lookups
      // { unique: false } because multiple entries can have same simplified
      // (e.g., 吃 and 喫 both have simplified 吃)
      entriesStore.createIndex('traditional', 't', { unique: false });
      entriesStore.createIndex('simplified', 's', { unique: false });
      
      // Create "knownWords" table
      const knownStore = db.createObjectStore('knownWords', {
        keyPath: 'word',  // The word itself is the primary key
      });
      knownStore.createIndex('simplified', 'simplified', { unique: false });
      knownStore.createIndex('traditional', 'traditional', { unique: false });
      
      // Create "cards" table for flashcards
      const cardsStore = db.createObjectStore('cards', {
        keyPath: 'id',
        autoIncrement: true,
      });
      cardsStore.createIndex('word', 'word', { unique: false });
      cardsStore.createIndex('createdAt', 'createdAt', { unique: false });
      
      // Create "meta" table for tracking state
      db.createObjectStore('meta');
    },
  });
}

// ============================================================
// DICTIONARY OPERATIONS
// ============================================================

/**
 * Check if dictionary has been loaded.
 */
export async function isDictLoaded(db: IDBPDatabase<MnemoDBSchema>): Promise<boolean> {
  const loaded = await db.get('meta', 'dictLoaded');
  return loaded === 'true';
}

/**
 * Load dictionary from JSON into IndexedDB.
 * 
 * This is called once on first visit. Progress callback allows
 * showing a loading bar since it takes a few seconds.
 * 
 * @param db - The database instance
 * @param jsonUrl - URL to fetch the dictionary JSON
 * @param onProgress - Callback with (loaded, total) for progress bar
 */
export async function loadDictionary(
  db: IDBPDatabase<MnemoDBSchema>,
  jsonUrl: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  console.log('Fetching dictionary JSON...');
  
  // Fetch the JSON file
  const response = await fetch(jsonUrl);
  const entries: DictEntry[] = await response.json();
  
  console.log(`Loaded ${entries.length} entries, inserting into IndexedDB...`);
  
  // Insert in batches to avoid blocking the UI
  const BATCH_SIZE = 5000;
  const total = entries.length;
  
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    
    // Use a transaction for each batch
    const tx = db.transaction('entries', 'readwrite');
    await Promise.all([
      ...batch.map(entry => tx.store.add(entry)),
      tx.done,
    ]);
    
    // Report progress
    const loaded = Math.min(i + BATCH_SIZE, total);
    onProgress?.(loaded, total);
    
    // Yield to UI thread briefly
    await new Promise(r => setTimeout(r, 0));
  }
  
  // Mark as loaded
  await db.put('meta', 'true', 'dictLoaded');
  console.log('Dictionary loaded into IndexedDB');
}

/**
 * Search the dictionary.
 * 
 * Returns words that START WITH the query. Exact matches appear first.
 * 
 * Examples:
 *   search("便")   → 便, 便宜, 便利, 便當, ...
 *   search("便宜") → 便宜, 便宜行事, ...
 * 
 * @param db - The database instance
 * @param query - Chinese characters to search for
 * @param limit - Maximum results to return (default 20)
 * @returns Array of matching entries, exact matches first
 */
export async function search(
  db: IDBPDatabase<MnemoDBSchema>,
  query: string,
  limit: number = 20
): Promise<DictEntry[]> {
  if (!query) return [];
  
  // IDBKeyRange.bound creates a range query:
  // - Start: "便" (inclusive)
  // - End: "便\uffff" (inclusive) - \uffff is highest Unicode char
  // This matches: 便, 便宜, 便利, etc. (anything starting with query)
  const range = IDBKeyRange.bound(query, query + '\uffff');
  
  const results: DictEntry[] = [];
  const seen = new Set<string>(); // Track by "traditional|simplified" to avoid dupes
  
  // Helper to add entry if not duplicate
  const addIfNew = (entry: DictEntry): boolean => {
    const key = `${entry.t}|${entry.s}`;
    if (seen.has(key)) return false;
    seen.add(key);
    results.push(entry);
    return true;
  };
  
  // Search traditional index first
  const tx = db.transaction('entries', 'readonly');
  const tradIndex = tx.store.index('traditional');
  
  let cursor = await tradIndex.openCursor(range);
  while (cursor && results.length < limit) {
    addIfNew(cursor.value);
    cursor = await cursor.continue();
  }
  
  // If we didn't hit limit, also search simplified
  if (results.length < limit) {
    const simpIndex = tx.store.index('simplified');
    let simpCursor = await simpIndex.openCursor(range);
    
    while (simpCursor && results.length < limit) {
      addIfNew(simpCursor.value);
      simpCursor = await simpCursor.continue();
    }
  }
  
  // Sort: exact matches first, then by length (shorter = more common)
  results.sort((a, b) => {
    const aExact = a.t === query || a.s === query;
    const bExact = b.t === query || b.s === query;
    
    // Exact matches first
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Then by length (shorter words first)
    return a.t.length - b.t.length;
  });
  
  return results;
}

/**
 * Check whether a candidate is an exact CC-CEDICT entry rather than merely a
 * prefix of another word.
 */
export async function isDictionaryWord(
  db: IDBPDatabase<MnemoDBSchema>,
  word: string
): Promise<boolean> {
  const results = await search(db, word, 50);
  return results.some(entry => entry.t === word || entry.s === word);
}

// ============================================================
// KNOWN WORDS OPERATIONS
// ============================================================

/**
 * Mark a word as known.
 */
export async function addKnownWord(
  db: IDBPDatabase<MnemoDBSchema>,
  word: string,
  simplified: string,
  traditional: string,
  source: string = 'mnemo'
): Promise<void> {
  const entry: KnownWord = {
    word,
    simplified,
    traditional,
    addedDate: new Date().toISOString(),
    source,
  };
  await db.put('knownWords', entry);
}

/**
 * Import known words from an external source such as Anki.
 * Existing words are preserved and not counted as new imports.
 */
export async function importKnownWords(
  db: IDBPDatabase<MnemoDBSchema>,
  words: Array<Pick<KnownWord, 'word' | 'simplified' | 'traditional' | 'source'>>
): Promise<number> {
  const existing = new Set(await db.getAllKeys('knownWords'));
  const transaction = db.transaction('knownWords', 'readwrite');
  let added = 0;

  for (const word of words) {
    if (!word.word || existing.has(word.word)) continue;

    await transaction.store.add({
      ...word,
      addedDate: new Date().toISOString(),
    });
    existing.add(word.word);
    added += 1;
  }

  await transaction.done;
  return added;
}

/**
 * Check if a word is known.
 */
export async function isWordKnown(
  db: IDBPDatabase<MnemoDBSchema>,
  word: string
): Promise<boolean> {
  const entry = await db.get('knownWords', word);
  return entry !== undefined;
}

/**
 * Remove words already present in the persistent vocabulary store.
 *
 * The generic item type lets callers retain extra fields such as CSV context.
 */
export async function filterKnownWords<T extends { word: string }>(
  db: IDBPDatabase<MnemoDBSchema>,
  items: T[]
): Promise<T[]> {
  const knownWords = new Set(await db.getAllKeys('knownWords'));
  return items.filter(item => !knownWords.has(item.word));
}

/**
 * Get count of known words.
 */
export async function getKnownWordCount(
  db: IDBPDatabase<MnemoDBSchema>
): Promise<number> {
  return db.count('knownWords');
}

/**
 * Get all known words (for export/backup).
 */
export async function getAllKnownWords(
  db: IDBPDatabase<MnemoDBSchema>
): Promise<KnownWord[]> {
  return db.getAll('knownWords');
}
