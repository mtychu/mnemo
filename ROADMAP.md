# mnemo Roadmap

## ✅ Phase 0: Setup (COMPLETE)
- [x] Project initialized with `uv`
- [x] Git repository
- [x] Folder structure
- [x] First commit

---

## 🚧 Phase 1: Chinese Vocabulary (IN PROGRESS)

**Goal:** End-to-end card creation for Chinese words

- [x] CC-CEDICT dictionary integration
  - [x] Download/parse CC-CEDICT
  - [x] SQLite caching for lookups
- [x] CSV/text word input (importer.py)
- [x] React GUI review screen
  - [x] Mark words as known/unknown
  - [x] CSV import with known-word filtering
  - [x] Anki learned/suspended import modes
  - [x] Preview and validate Anki vocabulary/example fields
  - [ ] Edit definition/nuance before export
- [ ] AnkiConnect integration
  - [ ] Create "mnemo Vocab" note type
  - [ ] Push local cards with correct fields
  - [x] Create language-specific `glyph-ja` and `glyph-zh` note types
  - [ ] Decide whether/how to migrate existing `Glyph` notes after testing the new types
  - [ ] Sync Anki learning state before marking words as known
    - [ ] Track pushed Anki note/card IDs for local cards
    - [ ] Add words to `knownWords` only after Anki marks them learned
    - [ ] Revisit or downgrade words that become suspended
- [ ] TTS audio generation (word + sentences)
- [ ] Context/source field support

---

## 🔮 Future (DO NOT BUILD YET)

### Phase 2: Japanese Vocabulary
- JMdict integration
- Hiragana readings
- Same workflow as Chinese

### Phase 3: Grammar Cards
- "mnemo Grammar" note type
- Production/output practice cards
- English prompt → target sentence

### Phase 4: Advanced Features
- Mobile + desktop companion app
- Text ingestion (paste YouTube transcript, diff against known vocab)
- Rotating/multi-context listening sentences
- Templated grammar prompts with swappable slots
- Images/screenshots on cards

### Phase 5: Maintenance Tools
- Consolidate existing Anki cards into consistent formats
- Reorder unlearned prebuilt cards by frequency (common words first)
- Monolingual definitions with English backup

---

## Design Decisions (Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | `uv` | Fast, modern, handles both deps and venvs |
| Database | SQLite | Simple, portable, sufficient for caching |
| Chinese dict | CC-CEDICT | Well-licensed, comprehensive ZH→EN |
| Japanese dict | JMdict | Well-licensed, comprehensive JP→EN |
| Anki integration | AnkiConnect | Standard API, works on desktop |
| Platform | macOS + Linux | Your work + personal machines |
| Language priority | Chinese first | Heritage speaker = simpler to validate |

## Note Types

### mnemo Vocab (Chinese + Japanese)
Fields: Expression, Reading, Zhuyin, Definition, Nuance, ExampleSentence, ExampleAudio, ExpressionAudio, Language, Context, Image

Card templates:
1. **Listening** — Front: audio only → Back: everything
2. **Reading** — Front: word → Back: definition + sentence

### mnemo Grammar
Fields: GrammarPoint, EnglishPrompt, TargetSentence, Explanation, TargetAudio, Language, Context, Image

Card template:
1. **Production** — Front: English prompt → Back: target sentence + explanation
