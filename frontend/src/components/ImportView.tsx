import { useRef } from 'react'
import './ImportView.css'

interface ImportedWord {
  word: string
  context: string
}

interface ImportViewProps {
  onImport: (words: ImportedWord[]) => void
  onImportKnownWords: (file: File) => void
  onImportFromAnki: () => void
  onBack: () => void
}

/**
 * View for importing words from CSV or text files.
 * 
 * Supported formats:
 * - CSV: word in first column, optional context in second
 * - Plain text: one word per line
 */
export function ImportView({ onImport, onImportKnownWords, onImportFromAnki, onBack }: ImportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const knownWordsInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const words = parseFile(text, file.name)
    
    if (words.length > 0) {
      onImport(words)
    }
  }

  const parseFile = (text: string, filename: string): ImportedWord[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)
    
    // Detect CSV by extension or content
    const isCSV = filename.endsWith('.csv') || lines.some(l => l.includes(','))
    
    if (isCSV) {
      return lines.map(line => {
        // Simple CSV parsing (handles most cases)
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
        return {
          word: parts[0] || '',
          context: parts[1] || ''
        }
      }).filter(w => w.word)
    } else {
      // Plain text: one word per line
      return lines.map(word => ({ word, context: '' }))
    }
  }

  return (
    <div className="import-view">
      <header>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Import Words</h1>
      </header>

      <div className="import-content">
        <p className="instructions">
          Import a list of words to review. Supports CSV (word, context) or plain text (one word per line).
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <button 
          className="import-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Select File
        </button>

        <input
          ref={knownWordsInputRef}
          type="file"
          accept=".json,application/json"
          onChange={event => {
            const file = event.target.files?.[0]
            if (file) onImportKnownWords(file)
            event.target.value = ''
          }}
          style={{ display: 'none' }}
        />

        <button
          className="import-btn secondary-import-btn"
          onClick={() => knownWordsInputRef.current?.click()}
        >
          Import known words from file
        </button>

        <button
          className="import-btn anki-import-page-btn"
          onClick={onImportFromAnki}
        >
          Import from Anki
        </button>

        <div className="format-help">
          <h3>CSV format example:</h3>
          <pre>便宜,from restaurant menu{'\n'}電腦,tech discussion{'\n'}學習</pre>
          
          <h3>Plain text example:</h3>
          <pre>便宜{'\n'}電腦{'\n'}學習</pre>
        </div>

          <input
            ref={knownWordsInputRef}
            type="file"
            accept=".json,application/json"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) onImportKnownWords(file)
              event.target.value = ''
            }}
            style={{ display: 'none' }}
          />

          <button
            className="backup-import-btn"
            onClick={() => knownWordsInputRef.current?.click()}
          >
            Import backup
          </button>
      </div>
    </div>
  )
}

export type { ImportedWord }
