from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

app = FastAPI()
client = OpenAI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request schema
class NewWord(BaseModel):
    lang: str
    word: str


# Endpoint
@app.post("/get-definition")
async def get_definition(request: NewWord):
    try:
        return client.responses.create(
            model="o4-mini-2025-04-16",
            input=f"For the word '{request.word}' in '{request.lang}', please provide a definition and an example sentence.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
