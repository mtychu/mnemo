from openai import OpenAI

client = OpenAI()


async def get_ai_vocab_data(target_language: str, term: str):
    prompt = f"For the word '{term}' in '{target_language}', please provide a definition in English and an example sentence in {target_language}."
    print(prompt)
    response = client.responses.create(
        model="o4-mini-2025-04-16",
        input=prompt,
    )
    print(response)
    return response
