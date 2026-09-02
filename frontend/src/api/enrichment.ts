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

// Preload voices for offline fallback (they load asynchronously)
if ('speechSynthesis' in window) {
  speechSynthesis.getVoices()
  speechSynthesis.onvoiceschanged = () => {}
}

/**
 * Play TTS using ResponsiveVoice.js (free for non-commercial use).
 * Falls back to browser TTS if RV not loaded or offline.
 */
let rvLoaded = false
let rvLoading = false

async function loadResponsiveVoice(): Promise<boolean> {
  if (rvLoaded) return true
  if (rvLoading) {
    // Wait for existing load
    await new Promise(r => setTimeout(r, 500))
    return rvLoaded
  }
  
  rvLoading = true
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=free'
    script.onload = () => {
      rvLoaded = true
      rvLoading = false
      resolve(true)
    }
    script.onerror = () => {
      rvLoading = false
      resolve(false)
    }
    document.head.appendChild(script)
  })
}

/**
 * Play TTS audio.
 * 
 * Strategy:
 * 1. Try ResponsiveVoice (good Chinese support, free for non-commercial)
 * 2. Fall back to browser speechSynthesis if offline or RV fails
 */
export async function speak(text: string, language: Language): Promise<void> {
  // Try ResponsiveVoice first (online)
  if (navigator.onLine) {
    const loaded = await loadResponsiveVoice()
    if (loaded && (window as any).responsiveVoice) {
      const rv = (window as any).responsiveVoice
      const voice = language === 'zh' ? 'Chinese Female' : 'Japanese Female'
      
      return new Promise((resolve) => {
        rv.speak(text, voice, {
          rate: 0.9,
          onend: () => resolve()
        })
      })
    }
  }
  
  // Fallback: browser's built-in TTS
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
    await new Promise(r => setTimeout(r, 50))
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'zh' ? 'zh-CN' : 'ja'
    utterance.rate = 0.85
    
    const voices = speechSynthesis.getVoices()
    const matchingVoice = voices.find(v => v.lang.startsWith(language))
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }
    
    speechSynthesis.speak(utterance)
  }
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
