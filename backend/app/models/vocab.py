# All models related to a word/vocab
# Includes example sentences, their translations, etc.

from pydantic import BaseModel, Field


class NewVocab(BaseModel):
    target_language: str = Field(..., description="User-selected language")
    term: str = Field(..., description="New/unkown term")


class Vocab(BaseModel):
    term: str
    pronunciation: str
    definition: str
    usage_notes: str
    audio_url: str
    user_notes: str | None = None


class Sentence(BaseModel):
    language: str
    original: str
    translation: str
