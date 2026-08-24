"""
CC-CEDICT Parser

Parses the CC-CEDICT dictionary format into structured Python objects.

Format: TRADITIONAL SIMPLIFIED [pinyin] /definition1/definition2/.../

Example: 傳統 传统 [chuan2 tong3] /tradition/traditional/
"""

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CedictEntry:
    """A single dictionary entry.
    
    Attributes:
        traditional: Traditional Chinese characters (e.g., 傳統)
        simplified: Simplified Chinese characters (e.g., 传统)
        pinyin: Pronunciation with tone numbers (e.g., "chuan2 tong3")
        definitions: List of English definitions
    """
    traditional: str
    simplified: str
    pinyin: str
    definitions: list[str]
    
    def __str__(self) -> str:
        """Human-readable representation."""
        defs = "; ".join(self.definitions)
        return f"{self.traditional} ({self.simplified}) [{self.pinyin}]: {defs}"


# Regex to parse a CC-CEDICT line
# Example: 傳統 传统 [chuan2 tong3] /tradition/traditional/
#
# Groups:
#   1: traditional (傳統)
#   2: simplified (传统)  
#   3: pinyin (chuan2 tong3)
#   4: definitions (/tradition/traditional/)
ENTRY_PATTERN = re.compile(
    r"^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+(.+)$"
)


def parse_line(line: str) -> CedictEntry | None:
    """Parse a single CC-CEDICT line into a CedictEntry.
    
    Args:
        line: A single line from the dictionary file
        
    Returns:
        CedictEntry if the line is a valid entry, None for comments/blank lines
    """
    # Skip comments and blank lines
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    
    match = ENTRY_PATTERN.match(line)
    if not match:
        # Some lines might not match the pattern (rare edge cases)
        return None
    
    traditional, simplified, pinyin, definitions_raw = match.groups()
    
    # Definitions are separated by / and have / at start and end
    # "/definition1/definition2/" -> ["definition1", "definition2"]
    definitions = [d.strip() for d in definitions_raw.split("/") if d.strip()]
    
    return CedictEntry(
        traditional=traditional,
        simplified=simplified,
        pinyin=pinyin,
        definitions=definitions,
    )


def parse_cedict(filepath: Path) -> list[CedictEntry]:
    """Parse the entire CC-CEDICT file.
    
    Args:
        filepath: Path to the cedict_ts.u8 file
        
    Returns:
        List of all dictionary entries
    """
    entries = []
    
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            entry = parse_line(line)
            if entry:
                entries.append(entry)
    
    return entries


# Quick test when run directly
if __name__ == "__main__":
    # Test parsing a few sample lines
    test_lines = [
        "# This is a comment",
        "傳統 传统 [chuan2 tong3] /tradition/traditional/",
        "你好 你好 [ni3 hao3] /hello/hi/",
        "電腦 电脑 [dian4 nao3] /computer/(Tw) calculator/CL:臺|台[tai2]/",
    ]
    
    print("Testing parser with sample lines:\n")
    for line in test_lines:
        entry = parse_line(line)
        if entry:
            print(f"  Input:  {line}")
            print(f"  Parsed: {entry}")
            print()
        else:
            print(f"  Skipped: {line!r}\n")
