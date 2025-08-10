# All models related to a word/vocab
# Includes example sentences, their translations, etc.

# Notes:
# add 'alias' key to bridge pythonic snake_case to frontend camelCase
# '...' indicates a required field, for optional use: term: Optional[str] = Field(None, description="Optional term")
# term: str = Field("default", description="Default term if none provided")

from pydantic import BaseModel, Field
from typing import List


# Model for new vocabulary, only includes fields from user-input
class NewVocab(BaseModel):

    tl: str = Field(
        ...,
        alias="tl",
        description="target language, the language that the user is learning",
    )
    term: str = Field(..., description="new term that the user wants to learn")


# Model for
class ExampleSentence(BaseModel):
    sentence: str = Field(..., description="sentence in the user's target language")
    translation: str = Field(
        ..., description="translation of the example sentence in englishz"
    )


class Vocab(BaseModel):
    term: str
    pronunciation: str
    part_of_speech: str
    tl_definition: str
    eng_definition: str
    usage_notes: str
    cautions: str
    audio_url: str
    user_notes: str | None = None
    example_sentences: List[ExampleSentence]


class Sentence(BaseModel):
    language: str
    original: str
    translation: str
