from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.vocab import router as vocab

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router to manage getting data about vocabulary
app.include_router(vocab)

#  uvicorn main:app --reload for development server
