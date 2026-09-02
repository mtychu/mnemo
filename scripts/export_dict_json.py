#!/usr/bin/env python3
"""
Convert CC-CEDICT SQLite database to JSON for browser/PWA use.

Output format optimized for IndexedDB import:
- One JSON array with all entries
- Each entry has: traditional, simplified, pinyin, definitions
- File is ~15MB uncompressed, ~3MB gzipped

The frontend will:
1. Fetch this JSON once
2. Import into IndexedDB
3. Build indexes on traditional/simplified columns
4. Never fetch again (offline-capable)
"""

import json
from pathlib import Path

from mnemo.dictionary.database import DictionaryDB

# Output paths
DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_JSON = DATA_DIR / "cedict.json"
OUTPUT_JSON_GZ = DATA_DIR / "cedict.json.gz"


def export_to_json() -> None:
    """Export CC-CEDICT from SQLite to JSON."""
    
    db = DictionaryDB()
    
    if not db.is_initialized():
        raise RuntimeError(
            "Dictionary database not initialized. Run:\n"
            "  uv run python scripts/download_cedict.py\n"
            "  uv run python -m mnemo.dictionary.database"
        )
    
    print("Reading entries from SQLite...")
    
    # Query all entries
    cursor = db.conn.execute("""
        SELECT traditional, simplified, pinyin, definitions
        FROM entries
    """)
    
    entries = []
    for row in cursor:
        # definitions is already JSON string in DB, parse it
        entry = {
            "t": row["traditional"],    # t = traditional (short keys save space)
            "s": row["simplified"],     # s = simplified
            "p": row["pinyin"],         # p = pinyin
            "d": json.loads(row["definitions"]),  # d = definitions (array)
        }
        entries.append(entry)
    
    db.close()
    
    print(f"Loaded {len(entries):,} entries")
    
    # Write uncompressed JSON
    print(f"Writing {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        # No indentation to save space; ensure_ascii=False keeps Chinese readable
        json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))
    
    json_size = OUTPUT_JSON.stat().st_size / (1024 * 1024)
    print(f"  Size: {json_size:.1f} MB")
    
    # Write gzipped version (what we'll actually serve)
    print(f"Writing {OUTPUT_JSON_GZ}...")
    import gzip
    with gzip.open(OUTPUT_JSON_GZ, "wt", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))
    
    gz_size = OUTPUT_JSON_GZ.stat().st_size / (1024 * 1024)
    print(f"  Size: {gz_size:.1f} MB (gzipped)")
    
    print("\nDone! Frontend will fetch the gzipped version.")
    print("Browser automatically decompresses gzip responses.")


def show_sample() -> None:
    """Show a few sample entries from the JSON."""
    if not OUTPUT_JSON.exists():
        print("JSON file not found. Run export first.")
        return
    
    with open(OUTPUT_JSON, encoding="utf-8") as f:
        entries = json.load(f)
    
    print("\nSample entries:")
    for entry in entries[:5]:
        print(f"  {entry['t']} ({entry['s']}) [{entry['p']}]")
        print(f"    → {entry['d'][0]}")


if __name__ == "__main__":
    export_to_json()
    show_sample()
