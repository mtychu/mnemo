"""Export known vocabulary from AnkiConnect for import into mnemo.

Anki must be open with AnkiConnect enabled. The script only reads notes; it
does not modify Anki.

Examples:
    uv run python scripts/export_anki_known_words.py
    uv run python scripts/export_anki_known_words.py --deck 中文
    uv run python scripts/export_anki_known_words.py --field Expression --field Word \
        --output data/anki_known_words.json
    uv run python scripts/export_anki_known_words.py --list-fields
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


DEFAULT_URL = "http://localhost:8765"
DEFAULT_DECK = "中文"
DEFAULT_FIELDS = ("Expression", "Word", "Chinese", "Vocabulary")


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


def build_query(deck: str | None) -> str:
    """Build an Anki search query, optionally limited to one deck."""
    return f'deck:"{deck}"' if deck else "*"


def clean_field(value: str) -> str:
    """Convert a basic Anki field value to plain text."""
    value = value.replace("<br>", " ")
    value = value.replace("<div>", "").replace("</div>", "")
    return value.strip()


def export_words(fields: tuple[str, ...], deck: str | None) -> list[dict[str, str]]:
    """Read and deduplicate vocabulary notes from Anki."""
    card_ids = invoke("findCards", query=build_query(deck))
    if not card_ids:
        return []

    cards = invoke("cardsInfo", cards=card_ids)
    words: dict[str, dict[str, str]] = {}

    for card in cards:
        card_fields = card.get("fields", {})
        word = next(
            (
                clean_field(card_fields[field].get("value", ""))
                for field in fields
                if field in card_fields and card_fields[field].get("value", "").strip()
            ),
            "",
        )
        if not word:
            continue

        words.setdefault(
            word,
            {
                "word": word,
                "simplified": word,
                "traditional": word,
                "source": "anki",
            },
        )

    return sorted(words.values(), key=lambda item: item["word"])


def print_model_fields() -> None:
    """Print Anki's note types and fields for configuring this bridge."""
    models = invoke("modelNamesAndFields")
    for model_name, fields in models.items():
        names = ", ".join(fields)
        print(f"{model_name}: {names}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--deck",
        default=DEFAULT_DECK,
        help=f"Only export cards from this Anki deck (default: {DEFAULT_DECK}).",
    )
    parser.add_argument(
        "--field",
        action="append",
        dest="fields",
        help="Note field containing the vocabulary. Repeat for multiple card types.",
    )
    parser.add_argument(
        "--list-fields",
        action="store_true",
        help="Print every Anki note type and its fields, then exit.",
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
    if args.list_fields:
        print_model_fields()
        return

    fields = tuple(args.fields or DEFAULT_FIELDS)
    words = export_words(fields=fields, deck=args.deck)
    payload = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "source": "anki",
        "deck": args.deck,
        "fields": list(fields),
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