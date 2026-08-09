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

# Run
uv run mnemo
```

## License

MIT
