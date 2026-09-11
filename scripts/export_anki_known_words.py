"""Export learned Chinese vocabulary from AnkiConnect for import into mnemo.

Anki must be open with AnkiConnect enabled. The script only reads notes; it
does not modify Anki.

Examples:
    uv run python scripts/export_anki_known_words.py
    uv run python scripts/export_anki_known_words.py --deck 中文 \
        --note-type "Chinese Recognition" --vocab-field Expression \
        --sentence-field ExampleSentence
    uv run python scripts/export_anki_known_words.py --list-options
"""

import argparse
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


DEFAULT_URL = "http://localhost:8765"
DEFAULT_DECK = "中文"
REVIEW_QUERY = "is:review -is:suspended"


class AnkiConnectError(RuntimeError):
    """Raised when AnkiConnect cannot complete a request."""


def invoke(action: str, **params: Any) -> Any:
    """Call one AnkiConnect action and return its result."""
    payload = json.dumps({"action": action, "version": 6, "params": params}).encode()
    request = Request(
        DEFAULT_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=10) as response:
            result = json.load(response)
    except URLError as exc:
        raise AnkiConnectError(
            "Could not connect to AnkiConnect at http://localhost:8765. "
            "Make sure Anki is open and the AnkiConnect add-on is enabled."
        ) from exc

    if result.get("error"):
        raise AnkiConnectError(f"AnkiConnect error: {result['error']}")

    return result["result"]


def build_query(deck: str, note_type: str) -> str:
    """Find learned, unsuspended cards for one deck and note type."""
    return f'deck:"{deck}" note:"{note_type}" {REVIEW_QUERY}'


def clean_field(value: str) -> str:
    """Convert a basic Anki field value to plain text."""
    value = value.replace("<br>", " ")
    value = value.replace("<div>", "").replace("</div>", "")
    return value.strip()


def tokenize_sentence(sentence: str) -> list[str]:
    """Split a Chinese example sentence into dictionary-like word candidates."""
    try:
        import jieba
    except ImportError as exc:
        raise AnkiConnectError(
            "Sentence tokenization requires jieba. Run: uv add jieba"
        ) from exc

    sentence = html.unescape(re.sub(r"<[^>]+>", "", sentence))
    return [
        token.strip()
        for token in jieba.lcut(sentence, HMM=True)
        if re.search(r"[\u3400-\u9fff]", token)
    ]


def export_words(
    deck: str,
    note_type: str,
    vocab_field: str,
    sentence_field: str,
    include_sentence_words: bool,
) -> list[dict[str, str]]:
    """Read learned notes and deduplicate vocabulary plus sentence words."""
    card_ids = invoke("findCards", query=build_query(deck, note_type))
    if not card_ids:
        return []

    cards = invoke("cardsInfo", cards=card_ids)
    note_ids = sorted({card["note"] for card in cards})
    notes = invoke("notesInfo", notes=note_ids)
    words: dict[str, dict[str, str]] = {}

    for note in notes:
        fields = note.get("fields", {})
        vocab = clean_field(fields.get(vocab_field, {}).get("value", ""))
        sentence = clean_field(fields.get(sentence_field, {}).get("value", ""))
        candidates = [vocab]
        if include_sentence_words:
            candidates.extend(tokenize_sentence(sentence))

        for word in candidates:
            if not word:
                continue
            words.setdefault(word, {
                "word": word,
                "simplified": word,
                "traditional": word,
                "source": "anki",
            })

    return sorted(words.values(), key=lambda item: item["word"])


def print_options() -> None:
    """Print decks and note types/fields for the import UI or CLI."""
    print("Decks:")
    for deck in invoke("deckNames"):
        print(f"  {deck}")
    print("\nNote types:")
    for model_name, fields in invoke("modelNamesAndFields").items():
        print(f"  {model_name}: {', '.join(fields)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--deck",
        default=DEFAULT_DECK,
        help=f"Anki deck to import (default: {DEFAULT_DECK}).",
    )
    parser.add_argument(
        "--note-type",
        required=False,
        help="Anki note type to import. One note type per run.",
    )
    parser.add_argument(
        "--vocab-field",
        required=False,
        help="Field containing the target vocabulary.",
    )
    parser.add_argument(
        "--sentence-field",
        required=False,
        help="Field containing an example sentence.",
    )
    parser.add_argument(
        "--no-sentence-words",
        action="store_true",
        help="Export only the vocabulary field, without sentence tokenization.",
    )
    parser.add_argument(
        "--list-options",
        action="store_true",
        help="Print decks and note fields, then exit.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/anki_known_words.json"),
        help="Output JSON path (default: data/anki_known_words.json).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.list_options:
        print_options()
        return

    if not args.note_type or not args.vocab_field or not args.sentence_field:
        raise SystemExit(
            "--note-type, --vocab-field, and --sentence-field are required "
            "(or use --list-options first)."
        )

    words = export_words(
        deck=args.deck,
        note_type=args.note_type,
        vocab_field=args.vocab_field,
        sentence_field=args.sentence_field,
        include_sentence_words=not args.no_sentence_words,
    )
    payload = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "source": "anki",
        "deck": args.deck,
        "noteType": args.note_type,
        "vocabField": args.vocab_field,
        "sentenceField": args.sentence_field,
        "includeSentenceWords": not args.no_sentence_words,
        "count": len(words),
        "words": words,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"Exported {len(words)} known words to {args.output}")


if __name__ == "__main__":
    try:
        main()
    except AnkiConnectError as exc:
        raise SystemExit(str(exc)) from exc