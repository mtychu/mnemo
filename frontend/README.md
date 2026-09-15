# mnemo frontend

React + TypeScript + Vite frontend for mnemo.

## Run

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Checks

```bash
npm run build
npm run lint
```

## First Run

The app fetches `public/cedict.json` and loads it into browser IndexedDB. The
initial load may take a little while. Later visits use the local cached copy.

The IndexedDB database is named `mnemo`; it contains the dictionary, known-word
store, local card drafts, and metadata. It is local to the current browser
profile and origin.

## AnkiConnect

Anki must be open with AnkiConnect enabled. Add the Vite origin to AnkiConnect's
CORS list:

```json
"webCorsOriginList": [
  "http://localhost",
  "http://localhost:5173"
]
```

On macOS, the configuration is usually:

```text
~/Library/Application Support/Anki2/addons21/2055492159/config.json
```

Restart Anki after changing the configuration. The app uses `deckNames`,
`modelNames`, `modelFieldNames`, `cardsInfo`, `notesInfo`, and `findCards`.

## Main Views

- Lookup: search the CC-CEDICT dictionary.
- Import Words: import CSV/text vocabulary and filter known words.
- Import from Anki: select a deck, note type, vocabulary field, and example
  field; learned cards seed known vocabulary and suspended cards enter review.
- Review: inspect candidates, listen to examples, and create local cards.

See the repository-level [README](../README.md) and [HANDOFF](../HANDOFF.md)
for the complete project state and migration notes.
