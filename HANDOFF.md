# mnemo Development Handoff

**Date:** 2026-09-15
**Branch:** `main`
**Status:** React frontend and Anki import workflow are usable; Anki card
creation/synchronization is the next major milestone.

## Start Here

```bash
cd /path/to/mnemo/frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

For Python utilities:

```bash
cd /path/to/mnemo
uv sync
```

The frontend is the active application. The original Python package remains
useful for dictionary parsing/import experiments but is not the current GUI.

## Current Frontend Workflow

### CSV

Import a CSV from the Import page. The first column is the vocabulary and the
second column is optional context. Words already in IndexedDB `knownWords` are
removed before review. The review screen supports:

- `K`: I know this
- `L`: Look it up on the initial prompt; Add card after lookup
- `Enter`: Add card after lookup
- `X`: Cancel and add to known vocabulary
- `M`: More context

The review queue shows example text, dictionary results, pinyin, and optional
translation. Local cards are currently stored in IndexedDB.

### Anki

The Import page opens **Import from Anki**. The page:

1. Connects to AnkiConnect.
2. Lists decks.
3. Lists only note types actually present in the selected deck.
4. Lets the user select the vocabulary and example fields.
5. Shows one real note as a field preview.
6. Previews learned or suspended candidates.

Learned mode queries:

```text
is:review -is:suspended
```

It imports the vocabulary field plus validated example-sentence words into
the known-word store. It does not create a review queue because learned Anki
cards are already study objects.

Suspended mode queries:

```text
is:suspended
```

It imports only the configured vocabulary field and sends those words through
the mnemo review queue, where fresh cards can be created.

## AnkiConnect Setup

Anki must be open with AnkiConnect enabled. On macOS, edit:

```text
~/Library/Application Support/Anki2/addons21/2055492159/config.json
```

Allow the Vite origin:

```json
"webCorsOriginList": [
  "http://localhost",
  "http://localhost:5173"
]
```

Restart Anki after changing the file. Check connectivity:

```bash
python3 -c 'import json,urllib.request; p=json.dumps({"action":"version","version":6}).encode(); r=urllib.request.Request("http://localhost:8765",data=p,headers={"Content-Type":"application/json"}); print(urllib.request.urlopen(r).read().decode())'
```

The installed AnkiConnect does not support `modelNamesAndFields`; the app uses
the compatible `modelNames` and `modelFieldNames` actions.

## Browser Data And Migration

The frontend uses IndexedDB database `mnemo` with these stores:

- `entries`: CC-CEDICT dictionary
- `knownWords`: persistent vocabulary records
- `cards`: local mnemo card drafts
- `meta`: dictionary load metadata

IndexedDB is local to the browser profile and origin. It does not automatically
move to another browser or computer. The Import page's **Import backup** action
accepts the JSON output from `export_anki_known_words.py`.

The Anki collection itself should be backed up from Anki before moving
machines. The current app does not yet have a complete IndexedDB export UI.

## Glyph Note Types

The existing `Glyph` model was inspected and cloned non-destructively into:

- `glyph-ja`
- `glyph-zh`

The original `Glyph` model and notes remain untouched. The script is:

```bash
uv run python scripts/split_glyph_note_type.py
```

It skips target models that already exist. The current existing `Glyph` note is
Chinese content in the `中文` deck, even though the old template is Japanese-
oriented, so do not migrate it blindly.

## Important Known Limitations

- **Add card** creates a local IndexedDB card but does not push it to Anki.
- Add card currently marks the word known provisionally. The intended behavior
  is to mark it known only after Anki reports the card as learned.
- Example-derived words from learned Anki notes usually have no individual
  Anki card IDs; they are known by provenance rather than card sync.
- Enrichment and TTS implementations include placeholders.
- The current `cards` store does not yet retain Anki note/card IDs or sync state.
- The old Python importer still performs dictionary lookup immediately; the
  active browser workflow filters known words before review.

## Next Recommended Work

1. Add Anki sync metadata to local cards (`ankiNoteId`, card IDs, sync state).
2. Implement AnkiConnect creation of `glyph-zh` and `glyph-ja` notes.
3. Push one local card and verify its field mapping in Anki.
4. Sync Anki learning state and promote words to `knownWords` only when learned.
5. Decide how to migrate the original `Glyph` notes.
6. Add a complete IndexedDB export/restore backup.

## Recent Checkpoint Commits

- `327ae83` split `Glyph` into `glyph-ja` and `glyph-zh`
- `91fafd0` added Anki field preview
- `bb6ff34` prevented duplicate Anki imports
- `56b6447` queued validated Anki sentence words
- `014ae87` added suspended Anki review import
- `b79fc71` fixed AnkiConnect model API compatibility

The repository was clean at the time this handoff was written.
