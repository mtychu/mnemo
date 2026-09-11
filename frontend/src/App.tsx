import { useState, useEffect, useRef } from 'react'
import { openMnemoDB, loadDictionary, search, isDictLoaded, filterKnownWords, importKnownWords } from './db/dictionary'
import type { DictEntry } from './db/dictionary'
import type { IDBPDatabase } from 'idb'
import { ImportView, type ImportedWord } from './components/ImportView'
import { ReviewView } from './components/ReviewView'
import { WordDetail } from './components/WordDetail'
import { AnkiImportView } from './components/AnkiImportView'
import './App.css'

type View = 'lookup' | 'import' | 'anki-import' | 'review'

// Module-level state to handle React StrictMode double-mount
let dbInstance: IDBPDatabase<any> | null = null;
let initPromise: Promise<void> | null = null;

function App() {
  const [view, setView] = useState<View>('lookup')
  const [importedWords, setImportedWords] = useState<ImportedWord[]>([])
  const [alreadyKnownImportCount, setAlreadyKnownImportCount] = useState(0)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DictEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [entryCount, setEntryCount] = useState(0)
  const [cardCount, setCardCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize database on mount
  useEffect(() => {
    async function init() {
      // If already initializing, wait for it
      if (initPromise) {
        await initPromise;
        if (dbInstance) {
          const tx = dbInstance.transaction('entries', 'readonly');
          const count = await tx.store.count();
          setEntryCount(count);
          setLoading(false);
        }
        return;
      }
      
      // Start initialization
      initPromise = (async () => {
        try {
          dbInstance = await openMnemoDB()
          
          const loaded = await isDictLoaded(dbInstance)
          
          if (!loaded) {
            await loadDictionary(dbInstance, '/cedict.json', (current, total) => {
              setLoadProgress(Math.round((current / total) * 100))
            })
          }
          
          const tx = dbInstance.transaction('entries', 'readonly')
          const count = await tx.store.count()
          setEntryCount(count)
          
          // Count cards
          const cardTx = dbInstance.transaction('cards', 'readonly')
          const cards = await cardTx.store.count()
          setCardCount(cards)
          
          setLoading(false)
          inputRef.current?.focus()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load dictionary')
          setLoading(false)
        }
      })();
      
      await initPromise;
    }
    
    init()
  }, [])

  // Search when query changes
  useEffect(() => {
    async function doSearch() {
      if (!dbInstance || !query.trim()) {
        setResults([])
        return
      }
      
      const found = await search(dbInstance, query.trim())
      setResults(found)
    }
    
    doSearch()
  }, [query])

  // Loading screen
  if (loading) {
    return (
      <div className="loading-screen">
        <h1>mnemo</h1>
        <p>Loading dictionary...</p>
        {loadProgress > 0 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${loadProgress}%` }} />
          </div>
        )}
        <p className="progress-text">{loadProgress}%</p>
      </div>
    )
  }

  // Error screen
  if (error) {
    return (
      <div className="error-screen">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  // Import view
  if (view === 'import') {
    return (
      <ImportView
        onImportKnownWords={async (file) => {
          if (!dbInstance) return

          try {
            const payload = JSON.parse(await file.text())
            const words = Array.isArray(payload) ? payload : payload.words
            if (!Array.isArray(words)) throw new Error('JSON does not contain a words array')

            const added = await importKnownWords(dbInstance, words)
            window.alert(`Imported ${added} new known words from Anki.`)
          } catch (err) {
            window.alert(err instanceof Error ? err.message : 'Could not import known words.')
          }
        }}
        onImportFromAnki={() => setView('anki-import')}
        onImport={async (words) => {
          if (!dbInstance) return

          const unknownWords = await filterKnownWords(dbInstance, words)

          if (unknownWords.length === 0) {
            window.alert('All imported words are already in your vocabulary.')
            return
          }

          setImportedWords(unknownWords)
          setAlreadyKnownImportCount(words.length - unknownWords.length)
          setView('review')
        }}
        onBack={() => setView('lookup')}
      />
    )
  }

  if (view === 'anki-import' && dbInstance) {
    return (
      <AnkiImportView
        db={dbInstance}
        onBack={() => setView('import')}
        onImported={() => setView('lookup')}
      />
    )
  }

  // Review view
  if (view === 'review' && dbInstance) {
    return (
      <ReviewView
        words={importedWords}
        db={dbInstance}
        alreadyKnownCount={alreadyKnownImportCount}
        onDone={() => {
          setImportedWords([])
          setView('lookup')
        }}
      />
    )
  }

  const refreshCardCount = async () => {
    if (!dbInstance) return
    const tx = dbInstance.transaction('cards', 'readonly')
    const count = await tx.store.count()
    setCardCount(count)
  }

  // Lookup view (default)
  return (
    <div className="app">
      <header>
        <h1>mnemo</h1>
        <div className="counts">
          <span className="entry-count">{entryCount.toLocaleString()} entries</span>
          {cardCount > 0 && (
            <span className="card-count">{cardCount} cards</span>
          )}
        </div>
      </header>
      
      <div className="search-container">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="輸入中文..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      <div className="results">
        {results.length === 0 && query && (
          <p className="no-results">No results for "{query}"</p>
        )}
        
        {results.map((entry, i) => (
          <div 
            key={`${entry.t}-${entry.p}-${i}`} 
            className="result-card clickable"
            onClick={() => setSelectedEntry(entry)}
          >
            <div className="characters">
              <span className="traditional">{entry.t}</span>
              {entry.t !== entry.s && (
                <span className="simplified">({entry.s})</span>
              )}
            </div>
            <div className="pinyin">{entry.p}</div>
            <ul className="definitions">
              {entry.d.map((def, j) => (
                <li key={j}>{def}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Word detail modal */}
      {selectedEntry && dbInstance && (
        <WordDetail
          entry={selectedEntry}
          db={dbInstance}
          onClose={() => setSelectedEntry(null)}
          onCardAdded={refreshCardCount}
        />
      )}

      <button className="import-fab" onClick={() => setView('import')}>
        + Import
      </button>
    </div>
  )
}

export default App
