"""
SQLite-backed dictionary database.

Provides fast lookups for Chinese words by caching CC-CEDICT in SQLite.
First run parses the dictionary file and populates the database.
Subsequent runs use the cached data for instant lookups.
"""

import sqlite3
from pathlib import Path

from mnemo.dictionary.cedict_parser import CedictEntry, parse_cedict


# Default paths (relative to project root)
DEFAULT_DICT_PATH = Path(__file__).parent.parent.parent.parent / "data" / "cedict_ts.u8"
DEFAULT_DB_PATH = Path(__file__).parent.parent.parent.parent / "data" / "cedict.db"


class DictionaryDB:
    """SQLite-backed dictionary for fast word lookups.
    
    Usage:
        db = DictionaryDB()
        db.initialize()  # Only needed once; builds the database from CC-CEDICT
        
        entries = db.lookup("你好")  # Returns list of matching CedictEntry objects
    """
    
    def __init__(
        self,
        db_path: Path = DEFAULT_DB_PATH,
        dict_path: Path = DEFAULT_DICT_PATH,
    ):
        """Initialize the database connection.
        
        Args:
            db_path: Where to store/read the SQLite database
            dict_path: Path to the CC-CEDICT file (for initial import)
        """
        self.db_path = db_path
        self.dict_path = dict_path
        self._conn: sqlite3.Connection | None = None
    
    @property
    def conn(self) -> sqlite3.Connection:
        """Get the database connection, opening it if needed."""
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            # Return rows as sqlite3.Row objects (dict-like access)
            self._conn.row_factory = sqlite3.Row
        return self._conn
    
    def close(self) -> None:
        """Close the database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None
    
    def is_initialized(self) -> bool:
        """Check if the database has been populated with dictionary data."""
        if not self.db_path.exists():
            return False
        
        # Check if the entries table exists and has data
        cursor = self.conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='entries'"
        )
        if not cursor.fetchone():
            return False
        
        cursor = self.conn.execute("SELECT COUNT(*) FROM entries")
        count = cursor.fetchone()[0]
        return count > 0
    
    def initialize(self, force: bool = False) -> None:
        """Create the database schema and import CC-CEDICT data.
        
        Args:
            force: If True, rebuild even if database already exists
        """
        if self.is_initialized() and not force:
            print(f"Database already initialized at {self.db_path}")
            return
        
        print("Initializing dictionary database...")
        
        # Create the schema
        self._create_schema()
        
        # Parse and import the dictionary
        self._import_cedict()
        
        print("Database initialization complete!")
    
    def _create_schema(self) -> None:
        """Create the database tables and indexes."""
        self.conn.executescript("""
            -- Drop existing tables if rebuilding
            DROP TABLE IF EXISTS entries;
            DROP TABLE IF EXISTS metadata;
            
            -- Main entries table
            -- Each row is one dictionary entry
            CREATE TABLE entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                traditional TEXT NOT NULL,
                simplified TEXT NOT NULL,
                pinyin TEXT NOT NULL,
                definitions TEXT NOT NULL  -- Stored as JSON array
            );
            
            -- Indexes for fast lookups
            -- We search by both traditional and simplified characters
            CREATE INDEX idx_traditional ON entries(traditional);
            CREATE INDEX idx_simplified ON entries(simplified);
            
            -- Metadata table for tracking dictionary version, import date, etc.
            CREATE TABLE metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        """)
        self.conn.commit()
    
    def _import_cedict(self) -> None:
        """Parse CC-CEDICT and insert all entries into the database."""
        import json
        from datetime import datetime
        
        if not self.dict_path.exists():
            raise FileNotFoundError(
                f"Dictionary file not found: {self.dict_path}\n"
                "Run: uv run python scripts/download_cedict.py"
            )
        
        print(f"Parsing {self.dict_path}...")
        entries = parse_cedict(self.dict_path)
        print(f"Parsed {len(entries):,} entries")
        
        print("Inserting into database...")
        
        # Batch insert for performance
        # We store definitions as a JSON array string
        cursor = self.conn.cursor()
        cursor.executemany(
            "INSERT INTO entries (traditional, simplified, pinyin, definitions) VALUES (?, ?, ?, ?)",
            [
                (e.traditional, e.simplified, e.pinyin, json.dumps(e.definitions))
                for e in entries
            ]
        )
        
        # Store metadata
        cursor.execute(
            "INSERT INTO metadata (key, value) VALUES (?, ?)",
            ("import_date", datetime.now().isoformat())
        )
        cursor.execute(
            "INSERT INTO metadata (key, value) VALUES (?, ?)",
            ("entry_count", str(len(entries)))
        )
        
        self.conn.commit()
        print(f"Inserted {len(entries):,} entries")
    
    def lookup(self, word: str) -> list[CedictEntry]:
        """Look up a word in the dictionary.
        
        Searches both traditional and simplified character fields.
        
        Args:
            word: Chinese characters to look up
            
        Returns:
            List of matching CedictEntry objects (may be empty)
        """
        import json
        
        # Search both traditional and simplified columns
        cursor = self.conn.execute(
            """
            SELECT traditional, simplified, pinyin, definitions
            FROM entries
            WHERE traditional = ? OR simplified = ?
            """,
            (word, word)
        )
        
        results = []
        for row in cursor:
            entry = CedictEntry(
                traditional=row["traditional"],
                simplified=row["simplified"],
                pinyin=row["pinyin"],
                definitions=json.loads(row["definitions"]),
            )
            results.append(entry)
        
        return results


# Quick test when run directly
if __name__ == "__main__":
    db = DictionaryDB()
    
    # Initialize if needed
    if not db.is_initialized():
        db.initialize()
    
    # Test some lookups
    test_words = ["你好", "電腦", "传统", "學習", "吃"]
    
    print("\n" + "=" * 50)
    print("Testing lookups:")
    print("=" * 50)
    
    for word in test_words:
        print(f"\nLooking up: {word}")
        entries = db.lookup(word)
        if entries:
            for entry in entries:
                print(f"  → {entry}")
        else:
            print("  (not found)")
    
    db.close()
