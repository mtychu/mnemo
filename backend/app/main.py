from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.word_data import router as word_data_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router to manage getting data about words
app.include_router(word_data_router)
