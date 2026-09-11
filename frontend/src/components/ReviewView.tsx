import { useState, useEffect } from 'react'
import { search, addKnownWord } from '../db/dictionary'
import type { DictEntry } from '../db/dictionary'
import type { IDBPDatabase } from 'idb'
import type { ImportedWord } from './ImportView'
import { getContext, getExample, speak, type ContextResponse, type ExampleResponse } from '../api/enrichment'
import { addCard, createCardFromEntry, hasCard } from '../db/cards'
import './ReviewView.css'

interface ReviewViewProps {
  words: ImportedWord[]
  db: IDBPDatabase<any>
  alreadyKnownCount: number
  onDone: () => void
}

type ReviewState = 'prompt' | 'lookup' | 'enriched' | 'done'

/**
 * Review imported words one at a time.
 * 
 * Flow for each word:
 * 1. Show the word (and context if provided)
 * 2. User chooses: "I know this" or "Look it up"
 * 3. If lookup: show dictionary results
 * 4. Optional: "More context" for AI enrichment
 * 5. "Got it" to continue
 */
export function ReviewView({ words, db, alreadyKnownCount, onDone }: ReviewViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [state, setState] = useState<ReviewState>('prompt')
  const [results, setResults] = useState<DictEntry[]>([])
  const [knownCount, setKnownCount] = useState(0)
  const [lookupCount, setLookupCount] = useState(0)
  
  // Enrichment state
  const [contextData, setContextData] = useState<ContextResponse | null>(null)
  const [exampleData, setExampleData] = useState<ExampleResponse | null>(null)
  const [loadingEnrichment, setLoadingEnrichment] = useState(false)

  const currentWord = words[currentIndex]
  const progress = ((currentIndex) / words.length) * 100

  // Reset state when word changes
  useEffect(() => {
    setState('prompt')
    setResults([])
    setContextData(null)
    setExampleData(null)
  }, [currentIndex])

  const handleKnown = async () => {
    await addKnownWord(db, currentWord.word, currentWord.word, currentWord.word, 'review')
    setKnownCount(k => k + 1)
    goNext()
  }

  const handleCancel = async () => {
    await addKnownWord(db, currentWord.word, currentWord.word, currentWord.word, 'review-cancelled')
    goNext()
  }

  const handleLookup = async () => {
    const found = await search(db, currentWord.word, 10)
    setResults(found)
    setLookupCount(l => l + 1)
    
    // Fetch example immediately for lookup view
    try {
      const example = await getExample({
        word: currentWord.word,
        language: 'zh',
        difficulty: 'intermediate'
      })
      setExampleData(example)
    } catch (err) {
      console.error('Failed to fetch example:', err)
    }
    
    setState('lookup')
  }

  const handleMoreContext = async () => {
    setLoadingEnrichment(true)
    
    // Get definitions from results for context
    const definitions = results.length > 0 
      ? results[0].d 
      : []
    
    // Fetch context and example in parallel
    const [context, example] = await Promise.all([
      getContext({
        word: currentWord.word,
        language: 'zh',  // TODO: detect or let user choose
        definitions,
        userContext: currentWord.context
      }),
      getExample({
        word: currentWord.word,
        language: 'zh',
        difficulty: 'intermediate'
      })
    ])
    
    setContextData(context)
    setExampleData(example)
    setLoadingEnrichment(false)
    setState('enriched')
  }

  const handleSpeak = () => {
    speak(currentWord.word, 'zh')
  }

  const handleSpeakSentence = () => {
    if (exampleData?.sentence) {
      speak(exampleData.sentence, 'zh')
    }
  }

  const handleAddCard = async () => {
    const entry = results[0]

    if (entry && !(await hasCard(db, entry.t))) {
      const card = createCardFromEntry(entry, {
        example: exampleData ?? undefined,
        userContext: currentWord.context,
      })
      await addCard(db, card)
    }

    await addKnownWord(db, currentWord.word, currentWord.word, currentWord.word, 'card')
    goNext()
  }

  const goNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setState('done')
    }
  }

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT'
        || target?.tagName === 'TEXTAREA'
        || target?.tagName === 'SELECT'
        || target?.isContentEditable

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return

      switch (event.key.toLowerCase()) {
        case 'k':
          if (state === 'prompt') void handleKnown()
          break
        case 'l':
          if (state === 'prompt') {
            void handleLookup()
          } else if (state === 'lookup' || state === 'enriched') {
            void handleAddCard()
          }
          break
        case 'enter':
          if (state === 'lookup' || state === 'enriched') {
            event.preventDefault()
            void handleAddCard()
          }
          break
        case 'x':
          if (state === 'lookup' || state === 'enriched') void handleCancel()
          break
        case 'm':
          if ((state === 'lookup' || state === 'enriched') && !loadingEnrichment) {
            void handleMoreContext()
          }
          break
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [state, loadingEnrichment, currentWord.word])

  // Done screen
  if (state === 'done') {
    return (
      <div className="review-view">
        <div className="done-screen">
          <h1>Done!</h1>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{words.length}</span>
              <span className="stat-label">words reviewed</span>
            </div>
            <div className="stat">
              <span className="stat-value">{knownCount}</span>
              <span className="stat-label">already knew</span>
            </div>
            <div className="stat">
              <span className="stat-value">{lookupCount}</span>
              <span className="stat-label">looked up</span>
            </div>
          </div>
          <button className="primary-btn" onClick={onDone}>
            Back to Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="review-view">
      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="review-header">
        <div>
          <span className="counter">{currentIndex + 1} / {words.length}</span>
          <span className="import-summary">{words.length} new · {alreadyKnownCount} already known</span>
        </div>
        <button className="skip-btn" onClick={onDone}>Exit</button>
      </div>

      {/* Fixed section: word card + buttons */}
      <div className="review-fixed">
        <div className="word-card">
          <div className="word-display">{currentWord.word}</div>
          {(state === 'lookup' || state === 'enriched') && (
            <button className="cancel-btn" onClick={handleCancel} title="Cancel and add to vocabulary (X)" data-shortcut="X">
              ×
            </button>
          )}
          {currentWord.context && (
            <div className="word-context">{currentWord.context}</div>
          )}
        </div>

        {/* Buttons stay below word */}
        {state === 'prompt' && (
          <div className="actions">
            <button className="action-btn known" onClick={handleKnown} title="I know this (K)" data-shortcut="K">
              ✓ I know this
            </button>
            <button className="action-btn lookup" onClick={handleLookup} title="Look it up (L)" data-shortcut="L">
              ? Look it up
            </button>
          </div>
        )}

        {(state === 'lookup' || state === 'enriched') && (
          <div className="lookup-actions">
            <button 
              className="secondary-btn" 
              onClick={handleMoreContext}
              disabled={loadingEnrichment}
              title="More context (M)"
              data-shortcut="M"
            >
              {loadingEnrichment ? 'Loading...' : '💡 More context'}
            </button>
            <button className="primary-btn" onClick={handleAddCard} title="Add card (L or Enter)" data-shortcut="L / Enter">
              Add card →
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content section */}
      {state === 'lookup' && (
        <div className="review-content">
          {/* Example sentence at top */}
          {exampleData && (
            <div className="example-prompt">
              <div className="example-prompt-header">
                <button className="tts-prompt-btn" onClick={handleSpeakSentence} title="Listen">
                  🔊
                </button>
                <div className="example-prompt-label">Example</div>
                <div style={{ width: '24px' }} /> {/* Spacer for centering */}
              </div>
              <p className="example-prompt-sentence">{exampleData.sentence}</p>
              {exampleData.pinyin && (
                <details className="example-prompt-details">
                  <summary>Pinyin</summary>
                  <p className="example-prompt-pinyin">{exampleData.pinyin}</p>
                </details>
              )}
              <details className="example-prompt-details">
                <summary>Translation</summary>
                <p className="example-prompt-translation">{exampleData.translation}</p>
              </details>
            </div>
          )}

          {results.length === 0 ? (
            <p className="no-results">No results found</p>
          ) : (
            results.map((entry, i) => (
              <div key={`${entry.t}-${i}`} className="result-card">
                <div className="characters">
                  <span className="traditional">{entry.t}</span>
                  {entry.t !== entry.s && (
                    <span className="simplified">({entry.s})</span>
                  )}
                  <button className="tts-btn" onClick={handleSpeak} title="Listen">
                    🔊
                  </button>
                </div>
                <div className="pinyin">{entry.p}</div>
                <ul className="definitions">
                  {entry.d.map((def, j) => (
                    <li key={j}>{def}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {state === 'enriched' && (
        <div className="review-content">
          {/* Dictionary result (collapsed) */}
          {results.length > 0 && (
            <div className="result-card compact">
              <div className="characters">
                <span className="traditional">{results[0].t}</span>
                <button className="tts-btn" onClick={handleSpeak} title="Listen">
                  🔊
                </button>
              </div>
              <div className="pinyin">{results[0].p}</div>
            </div>
          )}

          {/* AI Context */}
          {contextData && (
            <div className="enrichment-card">
              <h3>Usage & Nuance</h3>
              <p>{contextData.nuance}</p>
              
              {contextData.collocations.length > 0 && (
                <>
                  <h4>Common pairings</h4>
                  <div className="collocations">
                    {contextData.collocations.map((c, i) => (
                      <span key={i} className="collocation">{c}</span>
                    ))}
                  </div>
                </>
              )}
              
              <h4>Notes</h4>
              <p className="notes">{contextData.notes}</p>
            </div>
          )}

          {/* Example sentence */}
          {exampleData && (
            <div className="enrichment-card">
              <h3>Example</h3>
              <div className="example-sentence">
                <p className="sentence">{exampleData.sentence}</p>
                {exampleData.pinyin && (
                  <p className="reading">{exampleData.pinyin}</p>
                )}
                <p className="translation">{exampleData.translation}</p>
                <button className="tts-btn-inline" onClick={handleSpeakSentence}>
                  🔊 Listen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
