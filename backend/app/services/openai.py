from openai import OpenAI
from models.vocab import Vocab

client = OpenAI()


def get_ai_vocab_data(tl: str, term: str):
    prompt = f"For the word '{term}' in {tl}, please provide a definition in English and 3 example sentences in {tl}."
    print(prompt)
    response = client.responses.create(
        model="gpt-4.1",
        input=prompt,
    )
    print(response)
    return response.output[0].content[0].text
