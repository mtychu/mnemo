import { useEffect, useRef, useState } from 'react'
import { getAnkiModelsForDeck, getAnkiOptions, previewAnkiImport, type AnkiImportMode, type AnkiModel, type AnkiPreview } from '../api/anki'
import { isDictionaryWord } from '../db/dictionary'
import type { IDBPDatabase } from 'idb'
import type { ImportedWord } from './ImportView'
import './AnkiImportView.css'

interface AnkiImportViewProps {
  db: IDBPDatabase<any>
  onBack: () => void
  onLearnedWords: (words: ImportedWord[]) => Promise<number>
  onSuspendedWords: (words: ImportedWord[]) => Promise<void>
}

export function AnkiImportView({ db, onBack, onLearnedWords, onSuspendedWords }: AnkiImportViewProps) {
  const [decks, setDecks] = useState<string[]>([])
  const [models, setModels] = useState<AnkiModel[]>([])
  const [deck, setDeck] = useState('')
  const [modelName, setModelName] = useState('')
  const [vocabField, setVocabField] = useState('')
  const [sentenceField, setSentenceField] = useState('')
  const [mode, setMode] = useState<AnkiImportMode>('learned')
  const [preview, setPreview] = useState<AnkiPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const importInProgress = useRef(false)

  const selectedModel = models.find(model => model.name === modelName)

  useEffect(() => {
    getAnkiOptions()
      .then(options => {
        setDecks(options.decks)
        setDeck(options.decks[0] ?? '')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load Anki options.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!deck) return

    setModels([])
    setModelName('')
    setError(null)
    getAnkiModelsForDeck(deck)
      .then(deckModels => {
        setModels(deckModels)
        setModelName(deckModels[0]?.name ?? '')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load note types for this deck.'))
  }, [deck])

  useEffect(() => {
    const fields = selectedModel?.fields ?? []
    setVocabField(fields[0] ?? '')
    setSentenceField(fields[1] ?? fields[0] ?? '')
    setPreview(null)
    setMessage(null)
  }, [modelName])

  const handlePreview = async () => {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const result = await previewAnkiImport(deck, modelName, vocabField, sentenceField, mode)
      const validatedWords = await Promise.all(result.words.map(async word => {
        if (word.kind === 'vocabulary') return word
        return await isDictionaryWord(db, word.word) ? word : null
      }))
      setPreview({
        learnedNotes: result.learnedNotes,
        words: validatedWords.filter(word => word !== null),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not preview Anki notes.')
    } finally {
      setWorking(false)
    }
  }

  const handleImport = async () => {
    if (!preview || importInProgress.current) return

    importInProgress.current = true
    setImporting(true)
    setWorking(true)
    setError(null)
    try {
      const words = preview.words.map(word => ({ word: word.word, context: 'Imported from Anki' }))
      if (mode === 'learned') {
        const added = await onLearnedWords(words)
        const alreadyPresent = words.length - added
        setMessage(
          alreadyPresent > 0
            ? `Added ${added} new words. ${alreadyPresent} were already in your vocabulary.`
            : `Added ${added} new words to your known vocabulary.`,
        )
      } else {
        await onSuspendedWords(words)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import Anki words.')
    } finally {
      importInProgress.current = false
      setImporting(false)
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
          Import learned vocabulary into your known-word store, or send suspended vocabulary through a fresh review.
        </p>

        {loading && <p className="anki-status">Connecting to AnkiConnect...</p>}
        {error && <p className="anki-error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="anki-mode-toggle" role="group" aria-label="Anki card state">
              <button
                className={mode === 'learned' ? 'active' : ''}
                onClick={() => { setMode('learned'); setPreview(null) }}
              >
                Learned cards
              </button>
              <button
                className={mode === 'suspended' ? 'active' : ''}
                onClick={() => { setMode('suspended'); setPreview(null) }}
              >
                Suspended cards
              </button>
            </div>
            <p className="anki-mode-help">
              {mode === 'learned'
                ? 'Imports the target vocabulary plus words from example sentences. Suspended cards are excluded.'
                : 'Imports only the target vocabulary from suspended cards so mnemo can create fresh cards.'}
            </p>

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
              {working ? 'Working...' : `Preview ${mode === 'learned' ? 'learned' : 'suspended'} words`}
            </button>

            {preview && (
              <section className="anki-preview">
                <div className="anki-preview-header">
                  <div>
                    <strong>{preview.words.length} words found</strong>
                    <span>{preview.learnedNotes} {mode === 'learned' ? 'learned' : 'suspended'} notes</span>
                  </div>
                </div>
                <div className="anki-word-list">
                  {preview.words.map(word => (
                    <div className="anki-word-item" key={word.word}>
                      <span>{word.word}</span>
                      <small>{word.kind === 'vocabulary' ? 'vocabulary' : 'example'}</small>
                    </div>
                  ))}
                </div>
                {importing && (
                  <div className="anki-import-progress" role="status" aria-live="polite">
                    <div className="anki-import-progress-track">
                      <div className="anki-import-progress-fill" />
                    </div>
                    <span>Importing candidates...</span>
                  </div>
                )}
                <button className="anki-import-btn" onClick={handleImport} disabled={working || importing || preview.words.length === 0}>
                  {importing
                    ? 'Importing...'
                    : mode === 'learned'
                      ? `Import ${preview.words.length} candidates`
                      : `Add ${preview.words.length} words to review queue`}
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
