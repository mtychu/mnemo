# All APIs related to getting information about a word/vocabulary
from fastapi import APIRouter, HTTPException
from models.word_data import NewWord
from clients.openai import fetch_definition

router = APIRouter()


@router.post("/get-definition")
async def get_definition(request: NewWord):
    try:
        return await fetch_definition(request.lang, request.word)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
