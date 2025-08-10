from openai import OpenAI
from models.vocab import Vocab

client = OpenAI()


def get_ai_vocab_data(tl: str, term: str):
    response = client.responses.parse(
        model="gpt-4o-2024-08-06",
        input=[
            {
                "role": "system",
                "content": """You are a skilled language tutor
                 specializing in helping people speak and write naturally.""",
            },
            {
                "role": "user",
                "content": f"""For the word '{term}' in {tl}, 
                 please provide the following:
                    - a definition in {tl} in as simple language as possible
                    - a definition in English
                    - non-english pronunciation guide e.g. furigana, pinyin
                    - the part of speech, e.g. verb, noun, grammar point
                    - 3 example sentences in {tl} with their english translations.
                    - usage notes e.g. is it casual or formal? how common is it in
                      normal conversation? how/where is it typically used?
                    - cautions e.g are there any things learners should watch out for?
                      and are there any other things this is often confused for?
                    - a link to audio """,
            },
        ],
        text_format=Vocab,
    )
    print(response)
    return response.output[0].content[0].parsed
