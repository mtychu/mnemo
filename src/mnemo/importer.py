"""
Word importer module.

Reads words from files (CSV, plain text) and looks them up in the dictionary.
Produces ImportResult objects for downstream processing (GUI review, etc.).
"""

import csv
from pathlib import Path

from mnemo.dictionary.database import DictionaryDB
from mnemo.models.word import ImportResult, WordLookupResult


class WordImporter:
    """Import words from files and look them up in the dictionary.
    
    Supports multiple file formats:
    - Plain text: one word per line
    - CSV: word in first column, optional context in second column
    
    Usage:
        importer = WordImporter()
        result = importer.import_file("words.txt")
        
        for word in result.found:
            print(f"{word.word}: {word.entries[0].pinyin}")
        
        for word in result.not_found:
            print(f"Not found: {word.word}")
    """
    
    def __init__(self, db: DictionaryDB | None = None):
        """Initialize the importer.
        
        Args:
            db: Dictionary database to use for lookups. If None, creates a new one.
        """
        # Use provided database or create a new one
        # Allows dependency injection for testing
        self.db = db if db is not None else DictionaryDB()
        
        # Ensure database is initialized
        if not self.db.is_initialized():
            raise RuntimeError(
                "Dictionary database not initialized. Run:\n"
                "  uv run python scripts/download_cedict.py\n"
                "  uv run python -m mnemo.dictionary.database"
            )
    
    def import_file(self, filepath: str | Path, default_context: str = "") -> ImportResult:
        """Import words from a file.
        
        Auto-detects format based on file extension:
        - .csv: CSV format (word, optional context)
        - .txt or other: plain text (one word per line)
        
        Args:
            filepath: Path to the file to import
            default_context: Context to use for words without explicit context
                           (e.g., "Conversation with Yudai")
        
        Returns:
            ImportResult containing all lookup results
        """
        filepath = Path(filepath)
        
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")
        
        # Detect format by extension
        if filepath.suffix.lower() == ".csv":
            words_with_context = self._read_csv(filepath)
        else:
            words_with_context = self._read_plaintext(filepath)
        
        # Apply default context to words without explicit context
        words_with_context = [
            (word, context if context else default_context)
            for word, context in words_with_context
        ]
        
        # Look up each word
        results = []
        for word, context in words_with_context:
            entries = self.db.lookup(word)
            result = WordLookupResult(
                word=word,
                entries=entries,
                context=context,
            )
            results.append(result)
        
        return ImportResult(
            results=results,
            source_file=str(filepath),
        )
    
    def import_words(self, words: list[str], default_context: str = "") -> ImportResult:
        """Import a list of words directly (no file).
        
        Useful for programmatic input or testing.
        
        Args:
            words: List of Chinese words to look up
            default_context: Context to apply to all words
        
        Returns:
            ImportResult containing all lookup results
        """
        results = []
        for word in words:
            entries = self.db.lookup(word)
            result = WordLookupResult(
                word=word,
                entries=entries,
                context=default_context,
            )
            results.append(result)
        
        return ImportResult(results=results)
    
    def _read_plaintext(self, filepath: Path) -> list[tuple[str, str]]:
        """Read words from a plain text file (one word per line).
        
        Args:
            filepath: Path to the text file
            
        Returns:
            List of (word, context) tuples. Context is always empty for plaintext.
        """
        words = []
        
        with open(filepath, encoding="utf-8") as f:
            for line in f:
                # Strip whitespace and skip empty lines / comments
                line = line.strip()
                if line and not line.startswith("#"):
                    words.append((line, ""))
        
        return words
    
    def _read_csv(self, filepath: Path) -> list[tuple[str, str]]:
        """Read words from a CSV file.
        
        Expected format:
        - Column 1: word (required)
        - Column 2: context (optional)
        
        Header row is optional; if first cell looks like Chinese, treat as data.
        
        Args:
            filepath: Path to the CSV file
            
        Returns:
            List of (word, context) tuples
        """
        words = []
        
        with open(filepath, encoding="utf-8", newline="") as f:
            # Sniff the dialect (comma vs semicolon, quote style, etc.)
            sample = f.read(1024)
            f.seek(0)
            
            try:
                dialect = csv.Sniffer().sniff(sample)
            except csv.Error:
                # Default to standard CSV if sniffing fails
                dialect = csv.excel
            
            reader = csv.reader(f, dialect)
            
            for row in reader:
                if not row:
                    continue
                
                word = row[0].strip()
                
                # Skip empty rows and potential header rows
                # Header detection: if first cell is ASCII-only, probably a header
                if not word or word.isascii():
                    continue
                
                # Context is in second column if present
                context = row[1].strip() if len(row) > 1 else ""
                
                words.append((word, context))
        
        return words


# Quick test when run directly
if __name__ == "__main__":
    from mnemo.dictionary.database import DictionaryDB
    
    # Ensure database exists
    db = DictionaryDB()
    if not db.is_initialized():
        print("Initializing database first...")
        db.initialize()
    
    # Test with a list of words
    importer = WordImporter(db=db)
    
    test_words = [
        "你好",      # Common word - should be found
        "電腦",      # Traditional - should be found  
        "学习",      # Simplified - should be found
        "asdfasdf",  # Nonsense - should NOT be found
        "龘龘龘",    # Rare/made-up - probably NOT found
    ]
    
    print("Testing word import:")
    print("=" * 50)
    
    result = importer.import_words(test_words, default_context="Testing")
    
    print(f"\n{result.summary()}\n")
    
    print("Found:")
    for r in result.found:
        entry = r.entries[0]
        print(f"  {r.word} [{entry.pinyin}]: {entry.definitions[0]}")
    
    print("\nNot found:")
    for r in result.not_found:
        print(f"  {r.word}")
    
    db.close()
