# mnemo

mnemo is a browser-based tool for preparing Chinese vocabulary cards from CSV
files and Anki. Its long-term purpose is to turn real-world language exposure
into useful Anki study material.

## Current Workflow

### CSV import

1. Start the React app.
2. Use **Import** and select a CSV with one vocabulary item per row.
3. Optionally put context in the second column.
4. Words already in the browser's known-word store are filtered out.
5. Review unfamiliar words one at a time.
6. Look up definitions, inspect the example, and add a local card when needed.

### Anki import

The Anki page supports one deck and note type at a time:

- **Learned cards**: query `is:review -is:suspended`; import the configured
  vocabulary field plus validated words from the example field into the known
  vocabulary store.
- **Suspended cards**: query `is:suspended`; import only the configured
  vocabulary field into the mnemo review queue so fresh cards can be created.

The page loads only note types actually present in the selected deck. It also
shows a sample value for the selected vocabulary and example fields before the
import runs.

## Run Locally

### Frontend

```bash
cd frontend
npm install                 # first run only
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

Useful checks:

```bash
npm run build
npm run lint
```

The first browser visit loads `frontend/public/cedict.json` into IndexedDB.
The dictionary is cached locally after that.

### Python tools

```bash
cd /path/to/mnemo
uv sync
uv run python scripts/download_cedict.py       # one-time dictionary download
uv run python -m mnemo.dictionary.database      # optional SQLite cache setup
uv run python -m mnemo.importer                 # backend importer smoke test
```

## AnkiConnect Setup

Anki must be open with AnkiConnect enabled. On macOS, edit:

```text
~/Library/Application Support/Anki2/addons21/2055492159/config.json
```

The Vite origin must be allowed. For the usual port:

```json
"webCorsOriginList": [
  "http://localhost",
  "http://localhost:5173"
]
```

Restart Anki after changing the configuration. A quick connectivity check is:

```bash
python3 -c 'import json,urllib.request; p=json.dumps({"action":"version","version":6}).encode(); r=urllib.request.Request("http://localhost:8765",data=p,headers={"Content-Type":"application/json"}); print(urllib.request.urlopen(r).read().decode())'
```

## Data And Backups

The frontend stores the following data in browser IndexedDB:

- `entries`: CC-CEDICT dictionary rows
- `knownWords`: vocabulary considered known by the current workflow
- `cards`: local mnemo card drafts
- `meta`: dictionary loading metadata

IndexedDB is local to a browser profile and origin. It does not automatically
move to another browser, computer, or port. Use the Import page's **Import
backup** action for a JSON backup produced by the Anki export tool, and keep
the Anki collection itself backed up separately.

## Anki Utilities

Inspect available decks and note types:

```bash
uv run python scripts/export_anki_known_words.py --list-options
```

Export learned Anki vocabulary to JSON:

```bash
uv run python scripts/export_anki_known_words.py \
  --deck "中文" \
  --note-type "Chinese Sentence" \
  --vocab-field "Word" \
  --sentence-field "Example Sentence 1"
```

The export includes the configured vocabulary and tokenized example words.
The browser UI is the preferred import path because it previews candidates
and validates sentence-derived words against CC-CEDICT.

The existing `Glyph` model was cloned non-destructively into:

- `glyph-ja`
- `glyph-zh`

The original `Glyph` model and notes remain untouched until migration is
explicitly tested. Re-run the split utility only if setting up a new Anki
collection:

```bash
uv run python scripts/split_glyph_note_type.py
```

## Project Structure

```text
mnemo/
├── frontend/
│   └── src/
│       ├── api/                 # AnkiConnect and enrichment clients
│       ├── components/          # Import, Anki import, review, detail views
│       └── db/                  # IndexedDB dictionary and card storage
├── scripts/
│   ├── download_cedict.py
│   ├── export_dict_json.py
│   ├── export_anki_known_words.py
│   └── split_glyph_note_type.py
├── src/mnemo/                   # Original Python dictionary/import layer
├── data/                        # Runtime data; large files may be ignored
├── examples/                    # Sample CSV/text inputs
├── HANDOFF.md                   # Detailed continuation notes
└── ROADMAP.md                   # Longer-term plan
```

## Important Current Limitations

- Local **Add card** creates an IndexedDB draft; it does not yet push to Anki.
- The current review flow marks a word known provisionally when a local card is
  added. The intended future behavior is to mark it known only after Anki
  reports that its card is learned.
- Example-derived Anki words have no individual Anki card IDs. They are known
  through provenance from a learned example, not through card synchronization.
- Enrichment and TTS implementations contain placeholders.
- IndexedDB is a local cache, not a shared account database.

## License

MIT
