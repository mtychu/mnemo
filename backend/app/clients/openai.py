from openai import OpenAI

client = OpenAI()


async def fetch_definition(lang: str, word: str):
    prompt = (
        f"For the word '{word}' in '{lang}', "
        "please provide a definition in English and an example sentence n '{lang}'."
    )
    response = client.responses.create(
        model="o4-mini-2025-04-16",
        input=prompt,
    )
    return response
