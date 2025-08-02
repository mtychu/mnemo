# All models related to a word/vocab
# Includes example sentences, their translations, etc.

from pydantic import BaseModel


class Word(BaseModel):
    lang: str
    word: str
