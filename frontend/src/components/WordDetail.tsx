import { useEffect, useState } from 'react'
import type { DictEntry } from '../db/dictionary'
import type { IDBPDatabase } from 'idb'
import { getContext, getExample, speak, type ContextResponse, type ExampleResponse } from '../api/enrichment'
import { addCard, createCardFromEntry, hasCard } from '../db/cards'
import './WordDetail.css'

interface WordDetailProps {
  entry: DictEntry
  db: IDBPDatabase<any>
  userContext?: string
  onClose: () => void
  onCardAdded?: () => void
}

/**
 * Detailed view for a single word.
 * Shows dictionary info, allows TTS, enrichment, and card creation.
 */
export function WordDetail({ entry, db, userContext, onClose, onCardAdded }: WordDetailProps) {
  const [contextData, setContextData] = useState<ContextResponse | null>(null)
  const [exampleData, setExampleData] = useState<ExampleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [cardExists, setCardExists] = useState(false)
  const [cardAdded, setCardAdded] = useState(false)
  const [userNotes, setUserNotes] = useState('')

  // Check if card exists on mount
  useEffect(() => {
    hasCard(db, entry.t).then(setCardExists)
  }, [db, entry.t])

  const handleSpeak = () => {
    speak(entry.t, 'zh', {
      zhScript: 'traditional',
      fallbackText: entry.s
    })
  }

  const handleSpeakSentence = () => {
    if (exampleData?.sentence) {
      speak(exampleData.sentence, 'zh', {
        zhScript: 'traditional'
      })
    }
  }

  const handleGetContext = async () => {
    setLoading(true)
    
    const [context, example] = await Promise.all([
      getContext({
        word: entry.t,
        language: 'zh',
        definitions: entry.d,
        userContext
      }),
      getExample({
        word: entry.t,
        language: 'zh',
        difficulty: 'intermediate'
      })
    ])
    
    setContextData(context)
    setExampleData(example)
    setLoading(false)
  }

  const handleAddCard = async () => {
    const card = createCardFromEntry(entry, {
      context: contextData ?? undefined,
      example: exampleData ?? undefined,
      userContext,
      userNotes: userNotes || undefined
    })
    
    await addCard(db, card)
    setCardAdded(true)
    onCardAdded?.()
  }

  return (
    <div className="word-detail-overlay" onClick={onClose}>
      <div className="word-detail" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        {/* Word header */}
        <div className="word-header">
          <div className="word-main">
            <span className="traditional">{entry.t}</span>
            <button className="tts-btn" onClick={handleSpeak}>🔊</button>
          </div>
          {entry.t !== entry.s && (
            <div className="simplified">({entry.s})</div>
          )}
          <div className="pinyin">{entry.p}</div>
        </div>

        {/* Definitions */}
        <div className="section">
          <ul className="definitions">
            {entry.d.map((def, i) => (
              <li key={i}>{def}</li>
            ))}
          </ul>
        </div>

        {/* User context if provided */}
        {userContext && (
          <div className="section context-section">
            <span className="label">Context:</span> {userContext}
          </div>
        )}

        {/* Get more context button */}
        {!contextData && !loading && (
          <button className="action-btn context-btn" onClick={handleGetContext}>
            💡 Get more context
          </button>
        )}
        
        {loading && (
          <div className="loading-indicator">Loading...</div>
        )}

        {/* Enrichment data */}
        {contextData && (
          <div className="enrichment">
            <div className="section">
              <h3>Usage & Nuance</h3>
              <p>{contextData.nuance}</p>
            </div>

            {contextData.collocations.length > 0 && (
              <div className="section">
                <h4>Common pairings</h4>
                <div className="collocations">
                  {contextData.collocations.map((c, i) => (
                    <span key={i} className="collocation">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="section">
              <h4>Notes</h4>
              <p className="notes">{contextData.notes}</p>
            </div>
          </div>
        )}

        {/* Example sentence */}
        {exampleData && (
          <div className="section example-section">
            <h3>Example</h3>
            <p className="sentence">{exampleData.sentence}</p>
            {exampleData.pinyin && (
              <p className="reading">{exampleData.pinyin}</p>
            )}
            <p className="translation">{exampleData.translation}</p>
            <button className="tts-inline" onClick={handleSpeakSentence}>
              🔊 Listen
            </button>
          </div>
        )}

        {/* User notes */}
        <div className="section notes-input-section">
          <h4>Your notes (optional)</h4>
          <textarea
            className="notes-input"
            placeholder="Add your own notes..."
            value={userNotes}
            onChange={e => setUserNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Add card button */}
        <div className="card-actions">
          {cardAdded ? (
            <div className="card-added-msg">✓ Card added!</div>
          ) : cardExists ? (
            <div className="card-exists-msg">Card already exists</div>
          ) : (
            <button className="add-card-btn" onClick={handleAddCard}>
              + Add Card
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
