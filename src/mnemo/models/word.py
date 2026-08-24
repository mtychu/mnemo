"""
Data models for mnemo.

These classes represent the core data structures used throughout the application.
They're separate from dictionary-specific models (CedictEntry) to allow for
multiple dictionary sources and to represent our enriched card data.
"""

from dataclasses import dataclass, field


@dataclass
class WordLookupResult:
    """Result of looking up a single word in the dictionary.
    
    This represents one word the user wants to learn, along with all
    dictionary entries found for it.
    
    Attributes:
        word: The original word as input by the user
        entries: List of dictionary entries found (may be empty if not found)
        context: Optional context about where/when the word was encountered
                 (e.g., "Talking with Yudai in Toronto")
    
    Usage:
        result = WordLookupResult(word="你好", entries=[...])
        if result.found:
            print(result.entries[0].pinyin)
        else:
            print(f"'{result.word}' not in dictionary")
    """
    word: str
    entries: list = field(default_factory=list)  # List of CedictEntry objects
    context: str = ""
    
    @property
    def found(self) -> bool:
        """True if at least one dictionary entry was found."""
        return len(self.entries) > 0
    
    @property
    def entry_count(self) -> int:
        """Number of dictionary entries found."""
        return len(self.entries)
    
    def __str__(self) -> str:
        if self.found:
            # Show first entry's definition as preview
            first = self.entries[0]
            preview = first.definitions[0] if first.definitions else "(no definition)"
            extra = f" (+{len(self.entries) - 1} more)" if len(self.entries) > 1 else ""
            return f"{self.word}: {preview}{extra}"
        else:
            return f"{self.word}: (not found)"


@dataclass
class ImportResult:
    """Result of importing a batch of words.
    
    Tracks which words were found vs. not found, for reporting to the user.
    
    Attributes:
        results: All lookup results (both found and not found)
        source_file: Path to the file that was imported (if any)
    """
    results: list[WordLookupResult] = field(default_factory=list)
    source_file: str = ""
    
    @property
    def found(self) -> list[WordLookupResult]:
        """Words that were found in the dictionary."""
        return [r for r in self.results if r.found]
    
    @property
    def not_found(self) -> list[WordLookupResult]:
        """Words that were NOT found in the dictionary."""
        return [r for r in self.results if not r.found]
    
    @property
    def total_count(self) -> int:
        """Total number of words processed."""
        return len(self.results)
    
    @property
    def found_count(self) -> int:
        """Number of words found in dictionary."""
        return len(self.found)
    
    @property
    def not_found_count(self) -> int:
        """Number of words NOT found in dictionary."""
        return len(self.not_found)
    
    def summary(self) -> str:
        """Human-readable summary of the import."""
        return (
            f"Imported {self.total_count} words: "
            f"{self.found_count} found, {self.not_found_count} not found"
        )
