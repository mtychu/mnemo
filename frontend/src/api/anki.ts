const ANKI_CONNECT_URL = 'http://localhost:8765'

interface AnkiResponse<T> {
  result: T
  error: string | null
}

export interface AnkiModel {
  name: string
  fields: string[]
}

export interface AnkiWord {
  word: string
  simplified: string
  traditional: string
  source: string
  kind: 'vocabulary' | 'example'
}

export interface AnkiPreview {
  learnedNotes: number
  words: AnkiWord[]
}

export type AnkiImportMode = 'learned' | 'suspended'

async function invoke<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(ANKI_CONNECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, version: 6, params }),
    })
  } catch {
    throw new Error('Could not connect to AnkiConnect. Make sure Anki is open and localhost access is enabled.')
  }

  if (!response.ok) {
    throw new Error(`AnkiConnect returned HTTP ${response.status}.`)
  }

  const payload = await response.json() as AnkiResponse<T>
  if (payload.error) throw new Error(payload.error)
  return payload.result
}

export async function getAnkiOptions(): Promise<{ decks: string[]; models: AnkiModel[] }> {
  const [decks, modelNames] = await Promise.all([
    invoke<string[]>('deckNames'),
    invoke<string[]>('modelNames'),
  ])

  const models = await Promise.all(modelNames.map(async name => ({
    name,
    fields: await invoke<string[]>('modelFieldNames', { modelName: name }),
  })))

  return {
    decks,
    models,
  }
}

function cleanField(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

const FUNCTION_WORDS = new Set([
  '我', '你', '他', '她', '它', '的', '了', '嗎', '吗', '呢', '吧', '啊',
  '在', '有', '是', '和', '跟', '與', '与', '也', '都', '很', '不', '沒', '没',
  '這', '这', '那', '哪', '就', '才', '會', '会', '能', '要', '把', '被',
])

function normalizeChineseText(value: string): string {
  return value
    .replace(/[，。！？；：、“”‘’（）【】《》]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeChinese(sentence: string): string[] {
  sentence = normalizeChineseText(sentence)
  const Segmenter = (Intl as typeof Intl & {
    Segmenter?: new (locale: string, options: { granularity: string }) => {
      segment: (input: string) => Iterable<{ segment: string }>
    }
  }).Segmenter

  if (Segmenter) {
    const segmenter = new Segmenter('zh', { granularity: 'word' })
    return Array.from(segmenter.segment(sentence), part => part.segment)
      .map(word => word.trim())
      .filter(word => /[\u3400-\u9fff]/.test(word))
  }

  return Array.from(sentence.matchAll(/[\u3400-\u9fff]{2,4}/g), match => match[0])
}

export async function previewAnkiImport(
  deck: string,
  noteType: string,
  vocabField: string,
  sentenceField: string,
  mode: AnkiImportMode,
): Promise<AnkiPreview> {
  const stateQuery = mode === 'learned' ? 'is:review -is:suspended' : 'is:suspended'
  const query = `deck:"${deck}" note:"${noteType}" ${stateQuery}`
  const cardIds = await invoke<number[]>('findCards', { query })
  if (cardIds.length === 0) return { learnedNotes: 0, words: [] }

  const cards = await invoke<Array<{ note: number }>>('cardsInfo', { cards: cardIds })
  const noteIds = [...new Set(cards.map(card => card.note))]
  const notes = await invoke<Array<{ fields: Record<string, { value: string }> }>>('notesInfo', { notes: noteIds })
  const words = new Map<string, AnkiWord>()

  for (const note of notes) {
    const vocab = cleanField(note.fields[vocabField]?.value ?? '')
    const sentence = cleanField(note.fields[sentenceField]?.value ?? '')
    const sentenceWords = mode === 'learned'
      ? tokenizeChinese(sentence).filter(word => word.length > 1 && !FUNCTION_WORDS.has(word))
      : []
    const candidates = [
      { word: vocab, kind: 'vocabulary' as const },
      ...sentenceWords.map(word => ({ word, kind: 'example' as const })),
    ]

    for (const candidate of candidates) {
      const word = candidate.word
      if (!word) continue
      words.set(word, {
        word,
        simplified: word,
        traditional: word,
        source: 'anki',
        kind: candidate.kind,
      })
    }
  }

  return {
    learnedNotes: notes.length,
    words: [...words.values()].sort((a, b) => a.word.localeCompare(b.word, 'zh')),
  }
}
