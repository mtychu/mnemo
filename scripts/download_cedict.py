#!/usr/bin/env python3
"""
Download CC-CEDICT dictionary file.

CC-CEDICT is a freely available Chinese-English dictionary released under
Creative Commons Attribution-ShareAlike 4.0 International License.

Source: https://www.mdbg.net/chinese/dictionary?page=cedict
"""

import gzip
import urllib.request
from pathlib import Path

# CC-CEDICT is distributed as a gzipped text file
CEDICT_URL = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"

# Where we'll store it (relative to project root)
DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "cedict_ts.u8"


def download_cedict() -> Path:
    """Download and extract CC-CEDICT dictionary.
    
    Returns the path to the extracted dictionary file.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    if OUTPUT_FILE.exists():
        print(f"Dictionary already exists at {OUTPUT_FILE}")
        return OUTPUT_FILE
    
    print(f"Downloading CC-CEDICT from {CEDICT_URL}...")
    
    # Download the gzipped file
    gz_path = DATA_DIR / "cedict.txt.gz"
    urllib.request.urlretrieve(CEDICT_URL, gz_path)
    print(f"Downloaded to {gz_path}")
    
    # Extract it
    print("Extracting...")
    with gzip.open(gz_path, "rt", encoding="utf-8") as gz_file:
        content = gz_file.read()
    
    OUTPUT_FILE.write_text(content, encoding="utf-8")
    print(f"Extracted to {OUTPUT_FILE}")
    
    # Clean up the gz file
    gz_path.unlink()
    print("Cleaned up temporary file")
    
    # Show some stats
    lines = content.splitlines()
    entry_count = sum(1 for line in lines if line and not line.startswith("#"))
    print(f"\nDictionary has {entry_count:,} entries")
    
    return OUTPUT_FILE


if __name__ == "__main__":
    download_cedict()
