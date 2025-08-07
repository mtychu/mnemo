from openai import OpenAI
import time

client = OpenAI()


def get_ai_vocab_data(target_language: str, term: str):
    prompt = f"For the word '{term}' in {target_language}, please provide a definition in English and an example sentence in {target_language}."
    print(prompt)
    start_time = time.time()
    response = client.responses.create(
        model="gpt-4.1",
        input=prompt,
    )
    print("OpenAI Call Took:", time.time() - start_time)
    print(response)
    return response.output[0].content[0].text
