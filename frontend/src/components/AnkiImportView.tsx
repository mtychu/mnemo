import { useEffect, useState } from 'react'
import { getAnkiOptions, previewAnkiImport, type AnkiModel, type AnkiPreview } from '../api/anki'
import { importKnownWords } from '../db/dictionary'
import type { IDBPDatabase } from 'idb'
import './AnkiImportView.css'

interface AnkiImportViewProps {
  db: IDBPDatabase<any>
  onBack: () => void
  onImported: () => void
}

export function AnkiImportView({ db, onBack, onImported }: AnkiImportViewProps) {
  const [decks, setDecks] = useState<string[]>([])
  const [models, setModels] = useState<AnkiModel[]>([])
  const [deck, setDeck] = useState('')
  const [modelName, setModelName] = useState('')
  const [vocabField, setVocabField] = useState('')
  const [sentenceField, setSentenceField] = useState('')
  const [preview, setPreview] = useState<AnkiPreview | null>(null)
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const selectedModel = models.find(model => model.name === modelName)

  useEffect(() => {
    getAnkiOptions()
      .then(options => {
        setDecks(options.decks)
        setModels(options.models)
        setDeck(options.decks[0] ?? '')
        setModelName(options.models[0]?.name ?? '')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load Anki options.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const fields = selectedModel?.fields ?? []
    setVocabField(fields[0] ?? '')
    setSentenceField(fields[1] ?? fields[0] ?? '')
    setPreview(null)
    setMessage(null)
  }, [modelName, selectedModel])

  const handlePreview = async () => {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const result = await previewAnkiImport(deck, modelName, vocabField, sentenceField)
      setPreview(result)
      setSelectedWords(new Set(result.words.map(word => word.word)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not preview Anki notes.')
    } finally {
      setWorking(false)
    }
  }

  const toggleWord = (word: string) => {
    setSelectedWords(current => {
      const next = new Set(current)
      if (next.has(word)) next.delete(word)
      else next.add(word)
      return next
    })
  }

  const handleImport = async () => {
    if (!preview) return
    setWorking(true)
    setError(null)
    try {
      const words = preview.words.filter(word => selectedWords.has(word.word))
      const added = await importKnownWords(db, words)
      setMessage(`Added ${added} new words to your vocabulary.`)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import Anki words.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="anki-import-view">
      <header>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Import from Anki</h1>
      </header>

      <div className="anki-import-content">
        <p className="anki-intro">
          Import learned vocabulary and words from example sentences. New and suspended cards are excluded.
        </p>

        {loading && <p className="anki-status">Connecting to AnkiConnect...</p>}
        {error && <p className="anki-error">{error}</p>}

        {!loading && !error && (
          <>
            <label>Deck
              <select value={deck} onChange={event => setDeck(event.target.value)}>
                {decks.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>

            <label>Note type
              <select value={modelName} onChange={event => setModelName(event.target.value)}>
                {models.map(model => <option key={model.name} value={model.name}>{model.name}</option>)}
              </select>
            </label>

            <label>Vocabulary field
              <select value={vocabField} onChange={event => setVocabField(event.target.value)}>
                {selectedModel?.fields.map(field => <option key={field} value={field}>{field}</option>)}
              </select>
            </label>

            <label>Example sentence field
              <select value={sentenceField} onChange={event => setSentenceField(event.target.value)}>
                {selectedModel?.fields.map(field => <option key={field} value={field}>{field}</option>)}
              </select>
            </label>

            <button className="anki-preview-btn" onClick={handlePreview} disabled={working || !deck || !modelName}>
              {working ? 'Working...' : 'Preview learned words'}
            </button>

            {preview && (
              <section className="anki-preview">
                <div className="anki-preview-header">
                  <div>
                    <strong>{preview.words.length} words found</strong>
                    <span>{preview.learnedNotes} learned notes</span>
                  </div>
                  <button className="anki-select-btn" onClick={() => setSelectedWords(new Set(preview.words.map(word => word.word)))}>
                    Select all
                  </button>
                </div>
                <div className="anki-word-list">
                  {preview.words.map(word => (
                    <label className="anki-word-item" key={word.word}>
                      <input
                        type="checkbox"
                        checked={selectedWords.has(word.word)}
                        onChange={() => toggleWord(word.word)}
                      />
                      <span>{word.word}</span>
                    </label>
                  ))}
                </div>
                <button className="anki-import-btn" onClick={handleImport} disabled={working || selectedWords.size === 0}>
                  Import {selectedWords.size} selected words
                </button>
              </section>
            )}

            {message && <p className="anki-success">{message}</p>}
          </>
        )}
      </div>
    </div>
  )
}
