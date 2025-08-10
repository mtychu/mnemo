# All APIs related to getting information about a word/vocab
# This file should just pass variables to the logic inside the services

from fastapi import APIRouter, HTTPException
from models.vocab import NewVocab, Vocab
from services.openai import get_ai_vocab_data

router = APIRouter()

router = APIRouter(prefix="/vocab")


# Write a full vocabulary entry
@router.post("")
async def create_vocab_entry(vocab: Vocab):
    try:
        print("placeholder to write new vocabulary entry after user confirms details")
        return "placeholder to write new vocabulary entry after user confirms details"
    except Exception as e:
        print("❌ /vocab POST error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# Generate details for a new vocabulary entry
@router.post("/generate")
async def generate_vocab_data(new_vocab: NewVocab):
    try:
        print("running vocab/generate with input:", new_vocab)
        return get_ai_vocab_data(new_vocab.tl, new_vocab.term)
    except Exception as e:
        print("❌ /vocab/generate POST error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# Retrieve list of all existing vocabulary
@router.get("")
async def get_vocab_entry():
    try:
        print("placeholder to retrieve vocabulary entry")
        return "placeholder to retrieve vocabulary entry"
    except Exception as e:
        print("❌ /vocab GET error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
