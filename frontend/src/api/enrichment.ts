/**
 * Enrichment API - AI-powered context, examples, and TTS.
 * 
 * Currently returns placeholders. Will eventually call:
 * - OpenAI/Claude for context and examples
 * - Google/Azure TTS for audio
 * 
 * Supports: Chinese (zh), Japanese (ja)
 */

export type Language = 'zh' | 'ja'

export interface ContextRequest {
  word: string
  language: Language
  definitions?: string[]      // From dictionary lookup
  userContext?: string        // User-provided context (e.g., "from restaurant menu")
}

export interface ContextResponse {
  nuance: string              // Usage nuance, register, common mistakes
  collocations: string[]      // Common word pairings
  notes: string               // Additional notes for Anki card
}

export interface ExampleRequest {
  word: string
  language: Language
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export interface ExampleResponse {
  sentence: string            // Example sentence using the word
  translation: string         // English translation
  pinyin?: string             // For Chinese
  furigana?: string           // For Japanese
}

export interface TTSRequest {
  text: string
  language: Language
  voice?: 'male' | 'female'
  speed?: 'slow' | 'normal' | 'fast'
}

export interface SpeakOptions {
  // For Chinese, indicate whether the primary text is traditional or simplified.
  zhScript?: 'traditional' | 'simplified'
  // Optional alternate form (e.g., simplified fallback for zh-CN voices).
  fallbackText?: string
}

// ============================================================
// PLACEHOLDER IMPLEMENTATIONS
// These will be replaced with real API calls
// ============================================================

/**
 * Get AI-generated context for a word.
 * 
 * Future prompt strategy (token-efficient):
 * ```
 * Word: {word}
 * Defs: {definitions joined}
 * Context: {userContext}
 * 
 * Reply JSON: {nuance, collocations[], notes}
 * - nuance: 1 sentence on usage/register
 * - collocations: 3-5 common pairings
 * - notes: learner tips (common mistakes, similar words)
 * Keep each field under 50 words.
 * ```
 */
export async function getContext(req: ContextRequest): Promise<ContextResponse> {
  // Placeholder - simulate API delay
  await delay(500)
  
  return {
    nuance: `[Placeholder] "${req.word}" is commonly used in casual conversation.`,
    collocations: ['很' + req.word, req.word + '的'],
    notes: `[Placeholder] Often confused with similar-sounding words. Pay attention to tone.`
  }
}

/**
 * Get an example sentence using the word.
 * 
 * Future prompt:
 * ```
 * Word: {word} ({language})
 * Level: {difficulty}
 * 
 * Give 1 natural example sentence with translation.
 * Format: {sentence}|{translation}|{reading}
 * ```
 */
export async function getExample(req: ExampleRequest): Promise<ExampleResponse> {
  await delay(500)
  
  if (req.language === 'zh') {
    return {
      sentence: `[Placeholder] 這個${req.word}很有用。`,
      translation: `[Placeholder] This ${req.word} is very useful.`,
      pinyin: `Zhège ${req.word} hěn yǒuyòng.`
    }
  } else {
    return {
      sentence: `[Placeholder] この${req.word}はとても便利です。`,
      translation: `[Placeholder] This ${req.word} is very convenient.`,
      furigana: `この${req.word}はとてもべんりです。`
    }
  }
}

/**
 * Get TTS audio for text.
 * 
 * Returns a data URL or blob URL that can be played with <audio>.
 * Currently returns null (placeholder).
 */
export async function getTTS(req: TTSRequest): Promise<string | null> {
  await delay(200)
  
  // Placeholder - no actual audio
  console.log(`[TTS Placeholder] Would speak: "${req.text}" in ${req.language}`)
  return null
}

/**
 * Wait until browser voices are available.
 */
async function getVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return []

  const synth = speechSynthesis
  let voices = synth.getVoices()
  if (voices.length > 0) return voices

  voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const timeout = window.setTimeout(() => resolve(synth.getVoices()), 1200)
    synth.onvoiceschanged = () => {
      window.clearTimeout(timeout)
      resolve(synth.getVoices())
    }
    // Trigger voice list loading in some browsers.
    synth.getVoices()
  })

  return voices
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  language: Language,
  preferOnline: boolean,
  zhScript: 'traditional' | 'simplified'
): SpeechSynthesisVoice | undefined {
  const candidates = voices.filter(v => v.lang.toLowerCase().startsWith(language))
  if (candidates.length === 0) return undefined

  const onlineFirst = [...candidates].sort((a, b) => {
    const scoreA = (a.localService ? 0 : 2) + (a.default ? 1 : 0)
    const scoreB = (b.localService ? 0 : 2) + (b.default ? 1 : 0)
    return scoreB - scoreA
  })
  const localFirst = [...candidates].sort((a, b) => {
    const scoreA = (a.localService ? 2 : 0) + (a.default ? 1 : 0)
    const scoreB = (b.localService ? 2 : 0) + (b.default ? 1 : 0)
    return scoreB - scoreA
  })

  const ordered = preferOnline ? onlineFirst : localFirst

  if (language !== 'zh') return ordered[0]

  const zhTraditional = ordered.find(v => /(zh-tw|zh-hk|hant)/i.test(v.lang))
  const zhSimplified = ordered.find(v => /(zh-cn|zh-sg|hans)/i.test(v.lang))

  if (zhScript === 'traditional') return zhTraditional ?? ordered[0]
  return zhSimplified ?? ordered[0]
}

/**
 * Play TTS audio.
 *
 * Strategy:
 * 1) If online, prefer non-local (cloud) browser voices
 * 2) If offline, prefer local voices
 * 3) For Chinese, prefer zh-TW/zh-HK when speaking traditional text
 */
export async function speak(
  text: string,
  language: Language,
  options?: SpeakOptions
): Promise<void> {
  if (!('speechSynthesis' in window)) return

  const synth = speechSynthesis
  synth.cancel()
  await new Promise(r => setTimeout(r, 40))

  const voices = await getVoicesReady()
  const preferOnline = navigator.onLine
  const zhScript = options?.zhScript ?? 'traditional'

  const chosenVoice = pickVoice(voices, language, preferOnline, zhScript)

  let spokenText = text
  if (
    language === 'zh' &&
    chosenVoice &&
    options?.fallbackText &&
    /(zh-cn|zh-sg|hans)/i.test(chosenVoice.lang)
  ) {
    spokenText = options.fallbackText
  }

  const utterance = new SpeechSynthesisUtterance(spokenText)
  utterance.lang =
    language === 'zh'
      ? (zhScript === 'traditional' ? 'zh-TW' : 'zh-CN')
      : 'ja-JP'
  utterance.rate = 0.85
  if (chosenVoice) utterance.voice = chosenVoice

  await new Promise<void>((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    synth.speak(utterance)
  })
}

// ============================================================
// FUTURE: Real API implementation
// ============================================================

/**
 * Token-efficient prompt template for context enrichment.
 * Target: ~100 input tokens, ~150 output tokens
 */
export const CONTEXT_PROMPT_TEMPLATE = `Word: {word}
Defs: {definitions}
User context: {userContext}

JSON response format:
{"nuance":"<1 sentence: usage register, formality>","collocations":["<3-5 common pairings>"],"notes":"<learner tips: mistakes, similar words, mnemonics>"}

Rules:
- Each field max 40 words
- Be specific to this word
- {language} language`

/**
 * Token-efficient prompt for example sentences.
 */
export const EXAMPLE_PROMPT_TEMPLATE = `Word: {word} ({language})
Level: {difficulty}

One natural sentence with translation.
Format: sentence|translation|reading`

// ============================================================
// HELPERS
// ============================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
