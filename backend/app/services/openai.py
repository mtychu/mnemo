from openai import OpenAI
from models.vocab import Vocab

client = OpenAI()


def get_ai_vocab_data(tl: str, term: str):
    response = client.responses.parse(
        model="gpt-5",
        input=[
            {
                "role": "system",
                "content": "You are a skilled language tutor who produces concise, accurate answers.",
            },
            {
                "role": "user",
                "content": f"""For the {tl} word '{term}', produce a JSON object in the following schema:

                Vocab:
                pronunciation: (string) pronunciation guide in the target language (e.g., furigana, pinyin)
                part_of_speech: (string) part of speech in English
                tl_definition: (string) definition in the target language
                eng_definition: (string) definition in English
                usage_notes: (string) concise usage tips in English
                cautions: (string) any cautions or common mistakes in English
                example_sentences: (list of exactly 3 objects) each with:
                    - sentence: sentence in the target language
                    - translation: translation of the sentence in English

                Instructions:
                - Return ONLY valid JSON that conforms exactly to the schema above.
                - Do not include any extra text or commentary outside the JSON.
                - All fields must be present and non-empty strings.
                - Example sentences should be natural and varied.
                - Keep definitions and notes concise.
                """,
            },
        ],
        text_format=Vocab,
        reasoning={"effort": "low"},
        text={"verbosity": "low"},
    )
    print(response)
    return response.output[1].content[0].parsed

    # {
    #     "role": "system",
    #     "content": """You are a skilled language tutor
    #      specializing in helping people speak and write naturally.""",
    # },
    # {
    #     "role": "user",
    #     "content": f"""For the word '{term}' in {tl},
    #      please provide the following:
    #         - a definition in {tl}
    #         - a definition in English
    #         - non-english pronunciation guide e.g. furigana, pinyin
    #         - the part of speech in English
    #         - 3 example sentences in {tl} with their english translations
    #           in different conjugations and contexts
    #         - usage notes in English
    #         - cautions in English""",
    # },
