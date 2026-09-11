# mnemo Development Handoff

**Date:** 2026-08-30  
**Status:** Phase 1 in progress — dictionary + import done, GUI next

### Important TODO: Anki learning-state sync

The current local review flow marks a word as known when **Add card** creates
the local IndexedDB card. This is provisional. The intended behavior is to
push the card to Anki, track its Anki note/card IDs, and add the word to the
persistent `knownWords` store only after Anki reports that the card is learned
(for example, `is:review -is:suspended`). Suspended cards should be eligible
to return to mnemo's review queue.

---

## Quick Context

Morgan is building mnemo, a tool to automate Anki flashcard creation for Chinese/Japanese learning. The real goal is **language learning**; building this tool is secondary. AI writes most code, but every step must be explained—Morgan wants to understand the "why."

**Key working principles:**
- Go step by step, one small testable piece at a time
- Finishing > perfection (previous attempt failed due to scope creep)
- Park ambitions in ROADMAP.md; don't build until current phase works end-to-end

---

## What's Built (✅ Working)

### 1. Project Setup
- `uv` package manager with `pyproject.toml`
- Python 3.14 (pinned in `.python-version`)
- Src layout: `src/mnemo/`

### 2. Dictionary Layer
| File | Purpose |
|------|---------|
| `scripts/download_cedict.py` | Downloads CC-CEDICT (~125K Chinese-English entries) |
| `src/mnemo/dictionary/cedict_parser.py` | Parses CC-CEDICT format into `CedictEntry` dataclass |
| `src/mnemo/dictionary/database.py` | SQLite cache with indexes on traditional/simplified columns |

**Usage:**
```bash
uv run python scripts/download_cedict.py  # Download dictionary
uv run python -m mnemo.dictionary.database  # Initialize SQLite cache
```

### 3. Import Layer
| File | Purpose |
|------|---------|
| `src/mnemo/models/word.py` | `WordLookupResult`, `ImportResult` data classes |
| `src/mnemo/importer.py` | Reads CSV/text files, looks up each word in dictionary |

**Current behavior:** Reads file → looks up ALL words in dictionary → returns results in memory.

---

## Pending Decisions (⚠️ NEEDS MORGAN'S INPUT)

### Decision 1: When to do dictionary lookup?

**Current flow (wasteful):**
```
CSV → Look up ALL words → GUI → User marks 80% as "known" → Discard 80% of lookups
```

**Proposed flow (efficient):**
```
CSV → GUI shows raw words only → User marks known/unknown → Look up ONLY unknown words
```

**Arguments for proposed flow:**
- Most imported words will be "already known" (heritage speaker)
- Lookup + future LLM enrichment only matters for unknown words
- User can recognize `你好` without seeing "hello" definition

**Arguments for current flow:**
- Sometimes you *think* you know a word but miss secondary meanings
- e.g., `便宜` = "cheap" but also "let someone off easy" (different pronunciation)

**Compromise option:** Show raw words first, but have a "show definition" button in GUI for uncertain words.

**Action needed:** Morgan to decide. If changing, `importer.py` should be refactored to just return `list[tuple[str, str]]` (word, context) without lookup.

---

### Decision 2: GUI Framework

**Options considered:**

| Framework | Pros | Cons |
|-----------|------|------|
| **Textual** | Terminal-based, no deps, works over SSH | Text only, no images |
| **Tkinter** | Built into Python, no install | Looks dated |
| **PyQt/PySide** | Professional look, full-featured | Large dependency |
| **Web (Flask + htmx)** | Familiar if you know HTML/JS | Requires browser |

**Recommendation:** Textual (terminal UI) for Phase 1. Zero external deps beyond one pip package, works identically on macOS/Linux, fast iteration. Can add "real" GUI later.

**Action needed:** Morgan to confirm or choose alternative.

---

## What's Next (🚧 To Build)

Per ROADMAP.md Phase 1:

1. **GUI review screen** — Show words, let user mark known/unknown
2. **AnkiConnect integration** — Create note type, push cards
3. **TTS audio generation** — Audio for words + sentences

---

## Technical Notes for Next AI

### Running the project
```bash
cd /Users/mchu047/Documents/mnemo
uv sync                                      # Install deps
uv run python scripts/download_cedict.py    # Download CC-CEDICT (one-time)
uv run python -m mnemo.dictionary.database  # Initialize SQLite (one-time)
uv run python -m mnemo.importer             # Test import flow
```

### File locations
- Dictionary file: `data/cedict_ts.u8` (gitignored, ~10MB)
- SQLite cache: `data/cedict.db` (gitignored)
- Example inputs: `examples/sample_words.txt`, `examples/words_with_context.csv`

### Code patterns used
- **Dataclasses** for data containers (`CedictEntry`, `WordLookupResult`)
- **Dependency injection** (`WordImporter(db=...)` accepts optional DB for testing)
- **Lazy initialization** (`@property` for DB connection)
- **`if __name__ == "__main__":`** blocks for standalone testing of each module

### SQLite schema (cedict.db)
```sql
CREATE TABLE entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    traditional TEXT NOT NULL,
    simplified TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    definitions TEXT NOT NULL  -- JSON array: ["def1", "def2"]
);
CREATE INDEX idx_traditional ON entries(traditional);
CREATE INDEX idx_simplified ON entries(simplified);
```

### CC-CEDICT format
```
傳統 传统 [chuan2 tong3] /tradition/traditional/
│     │     │              │
│     │     │              └── Definitions (/-separated)
│     │     └── Pinyin (tone numbers, not diacritics)
│     └── Simplified characters
└── Traditional characters
```

---

## Morgan's Background (for calibrating explanations)

- Comfortable with Python and git basics
- Familiar with SQL via MSSQL/MySQL at work
- Some React/Angular; no strong preference
- Heritage Mandarin speaker (strong Chinese), learning Japanese
- Wants the "why" explained, not just the "what"

---

## Files to Review

If picking this up, read in this order:
1. `ROADMAP.md` — Full project vision and Phase 1 scope
2. `README.md` — Architecture notes and current status
3. `src/mnemo/dictionary/cedict_parser.py` — How dictionary entries are parsed
4. `src/mnemo/dictionary/database.py` — SQLite caching layer
5. `src/mnemo/importer.py` — Current import logic (may need refactoring per Decision 1)

---

## Git Status

Last commit: `b821865` — "Add CC-CEDICT dictionary integration and word importer"

No uncommitted changes at time of handoff (check `git status` to confirm).
