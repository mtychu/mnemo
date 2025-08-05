# All APIs related to getting information about a word/vocab
from fastapi import APIRouter, HTTPException
from backend.app.models.vocab import NewVocab, Vocab
from services.openai import fetch_definition

router = APIRouter()

router = APIRouter(prefix="/vocab")


# Write a full vocabulary entry
@router.post("")
async def write_vocab_entry(vocab: Vocab):
    try:
        print("placeholder to write new vocabulary entry")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Generate details for a new vocabulary entry
@router.post("/generate")
async def generate_vocab_data(request: NewVocab):
    try:
        return await fetch_definition(request.lang, request.word)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
