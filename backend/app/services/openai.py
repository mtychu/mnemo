from openai import OpenAI
from models.vocab import VocabDefinition, VocabNotes, ExampleSentence

client = OpenAI()


def get_ai_vocab_definition(tl: str, term: str):
    response = client.responses.parse(
        model="gpt-5-nano-2025-08-07",
        input=[
            {
                "role": "system",
                "content": """You are a skilled language tutor who produces concise,
                              accurate answers.""",
            },
            {
                "role": "user",
                "content": f"""For the word '{term}' in {tl}, provide the following in a JSON object:
                                term: (string) '{term}' in its most common or base form,
                                pronounciation: (string) pronunciation guide typical for {tl},
                                tl_definition: (string) a definition in {tl},
                                eng_definition: (string) a definition in English""",
            },
        ],
        text_format=VocabDefinition,
        reasoning={"effort": "low"},
        text={"verbosity": "low"},
    )
    print(response)
    return response.output[1].content[0].parsed


def get_ai_vocab_notes(tl: str, term: str):
    response = client.responses.parse(
        model="gpt-5-nano-2025-08-07",
        input=[
            {
                "role": "system",
                "content": """You are a skilled language tutor who produces concise, accurate answers.""",
            },
            {
                "role": "user",
                "content": f"""For the {tl} word '{term}', provide the following in a JSON object:
                               usage_notes: (string) any notes about '{term}' that would be useful for English speakers,
                               cautions: (string) any warnings or common mistakes English speakers might make when using '{term}'""",
            },
        ],
        text_format=VocabNotes,
        reasoning={"effort": "low"},
        text={"verbosity": "low"},
    )
    print(response)
    return response.output[1].content[0].parsed


def get_ai_vocab_sentences(tl: str, term: str):
    response = client.responses.parse(
        model="gpt-5-nano-2025-08-07",
        input=[
            {
                "role": "system",
                "content": """You are a skilled language tutor who produces concise, accurate answers.""",
            },
            {
                "role": "user",
                "content": f"""Given ExampleSentence is an object with 'sentence' and 'translation' keys, for the {tl} word '{term}', provide the following in a JSON object:
                               example_sentences: [exampleSentence] 3 example sentences in as many different contexts as possible 
                    """,
            },
        ],
        text_format=[ExampleSentence],
        reasoning={"effort": "low"},
        text={"verbosity": "low"},
    )
    print(response)
    return response.output[1].content[0].parsed
