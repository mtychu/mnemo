/**
 * Card storage for Anki-style flashcards.
 * 
 * Cards are stored in IndexedDB alongside dictionary entries.
 * Basic template for now - will be expanded later.
 */

import type { IDBPDatabase } from 'idb'
import type { DictEntry } from './dictionary'
import type { ContextResponse, ExampleResponse } from '../api/enrichment'

// ============================================================
// TYPES
// ============================================================

export interface Card {
  id?: number                  // Auto-generated
  word: string                 // The word being studied
  traditional: string
  simplified: string
  pinyin: string
  definitions: string[]
  
  // Enrichment (optional)
  nuance?: string
  collocations?: string[]
  notes?: string
  exampleSentence?: string
  exampleTranslation?: string
  exampleReading?: string
  
  // User additions
  userNotes?: string
  context?: string             // Where the word was encountered
  
  // Metadata
  language: 'zh' | 'ja'
  createdAt: string
  lastReviewed?: string
  reviewCount: number
  
  // Future: SRS data
  // interval: number
  // easeFactor: number
  // dueDate: string
}

// ============================================================
// CARD OPERATIONS
// ============================================================

/**
 * Add a new card to the database.
 */
export async function addCard(
  db: IDBPDatabase<any>,
  card: Omit<Card, 'id'>
): Promise<number> {
  // Ensure cards store exists (it should from db init)
  const tx = db.transaction('cards', 'readwrite')
  const id = await tx.store.add(card)
  await tx.done
  return id as number
}

/**
 * Get all cards.
 */
export async function getAllCards(
  db: IDBPDatabase<any>
): Promise<Card[]> {
  return db.getAll('cards')
}

/**
 * Get card count.
 */
export async function getCardCount(
  db: IDBPDatabase<any>
): Promise<number> {
  return db.count('cards')
}

/**
 * Check if a card already exists for this word.
 */
export async function hasCard(
  db: IDBPDatabase<any>,
  word: string
): Promise<boolean> {
  const card = await db.getFromIndex('cards', 'word', word)
  return card !== undefined
}

/**
 * Delete a card by ID.
 */
export async function deleteCard(
  db: IDBPDatabase<any>,
  id: number
): Promise<void> {
  await db.delete('cards', id)
}

// ============================================================
// CARD CREATION HELPERS
// ============================================================

/**
 * Create a card from dictionary entry + optional enrichment.
 */
export function createCardFromEntry(
  entry: DictEntry,
  enrichment?: {
    context?: ContextResponse
    example?: ExampleResponse
    userContext?: string
    userNotes?: string
  }
): Omit<Card, 'id'> {
  return {
    word: entry.t,
    traditional: entry.t,
    simplified: entry.s,
    pinyin: entry.p,
    definitions: entry.d,
    
    // Enrichment
    nuance: enrichment?.context?.nuance,
    collocations: enrichment?.context?.collocations,
    notes: enrichment?.context?.notes,
    exampleSentence: enrichment?.example?.sentence,
    exampleTranslation: enrichment?.example?.translation,
    exampleReading: enrichment?.example?.pinyin || enrichment?.example?.furigana,
    
    // User
    context: enrichment?.userContext,
    userNotes: enrichment?.userNotes,
    
    // Metadata
    language: 'zh',
    createdAt: new Date().toISOString(),
    reviewCount: 0
  }
}
