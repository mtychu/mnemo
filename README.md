# mnemo 📚

Automate Anki flashcard creation for language learning (Chinese + Japanese).

**Mission:** Never let vocabulary or grammar learned from real-world interactions go to waste.

## What it does

Replaces this manual workflow:
1. Google Translate → 2. Ask LLM → 3. Look up definition → 4. Request example sentences → 5. Build Anki card manually

With this:
1. Input words → 2. Dictionary lookup (cached) → 3. GUI review → 4. Auto-push to Anki

## Current Focus (Phase 1)

Chinese vocabulary: CSV input → CC-CEDICT lookup → GUI review → Anki via AnkiConnect

## Setup

```bash
# Install dependencies
uv sync

# Download CC-CEDICT dictionary
uv run python scripts/download_cedict.py

# Run
uv run mnemo
```

---

## Architecture Notes (for developers / AI agents)

### Project Structure

```
mnemo/
├── scripts/                    # Standalone utility scripts (not part of package)
│   └── download_cedict.py      # Downloads CC-CEDICT dictionary file
├── src/mnemo/                  # Main package (src layout)
│   ├── dictionary/             # Dictionary lookup modules
│   │   ├── cedict_parser.py    # Parses CC-CEDICT format → CedictEntry objects
│   │   └── database.py         # SQLite cache for fast lookups
│   ├── models/                 # Data models
│   │   └── word.py             # WordLookupResult, ImportResult
│   ├── importer.py             # CSV/text file import → dictionary lookup
│   ├── db/                     # (Future) User data, known words tracking
│   ├── gui/                    # (Future) Review interface
│   └── anki/                   # (Future) AnkiConnect integration
├── data/                       # Runtime data (gitignored)
│   ├── cedict_ts.u8            # CC-CEDICT dictionary file (~10MB)
│   └── cedict.db               # SQLite cache of parsed dictionary
├── examples/                   # Sample input files
│   ├── sample_words.txt        # Plain text word list
│   └── words_with_context.csv  # CSV with word + context columns
└── tests/                      # Test suite
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Src layout** | `src/mnemo/` not `mnemo/` | Prevents accidental imports of local files instead of installed package |
| **SQLite for dictionary** | Cache parsed CC-CEDICT in SQLite | First parse takes ~5s; subsequent lookups are instant via indexed queries |
| **Definitions as JSON** | Store `["def1", "def2"]` as JSON string | Simpler than normalized table; we always want all definitions together |
| **Lazy DB connection** | `@property` getter creates connection on first use | Fast object creation; no I/O until needed |
| **Tone numbers not diacritics** | CC-CEDICT uses `ni3 hao3` not `nǐ hǎo` | Converter to be added later; store raw format from source |
| **Dependency injection** | `WordImporter(db=...)` accepts optional DB | Enables testing without real database; default creates real DB |
| **CSV dialect sniffing** | Auto-detect comma/semicolon/quotes | Works with Excel exports, European CSVs, etc. |

### Data Flow (Phase 1)

```
CSV file (word list)
    ↓
WordImporter (reads CSV, validates)
    ↓
DictionaryDB.lookup() (SQLite query)
    ↓
List[CedictEntry] (with definitions, pinyin)
    ↓
GUI Review (user marks known/unknown)
    ↓
LLM enrichment (example sentences, nuance)  ← Future
    ↓
AnkiConnect (push cards)                     ← Future
```

### Current Implementation Status

- ✅ `scripts/download_cedict.py` — Downloads dictionary
- ✅ `cedict_parser.py` — Parses CC-CEDICT format
- ✅ `database.py` — SQLite caching and lookup
- ✅ `importer.py` — CSV/text file import with dictionary lookup
- ✅ `models/word.py` — WordLookupResult, ImportResult data classes
- 🚧 GUI review — Next to build
- ⬜ AnkiConnect integration

### Testing Modules Directly

Each module has a `if __name__ == "__main__":` block for standalone testing:

```bash
# Test parser
uv run python -m mnemo.dictionary.cedict_parser

# Test database (initializes if needed, runs sample lookups)
uv run python -m mnemo.dictionary.database

# Test importer
uv run python -m mnemo.importer
```

---

## License

MIT
