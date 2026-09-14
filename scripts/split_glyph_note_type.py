"""Create language-specific clones of the existing Glyph Anki note type.

This script is intentionally non-destructive: it leaves the original Glyph
model and notes untouched. Run it while Anki is open with AnkiConnect enabled.
"""

import json
from typing import Any
from urllib.request import Request, urlopen

ANKI_URL = "http://localhost:8765"
SOURCE_MODEL = "Glyph"
TARGETS = {
    "glyph-ja": "ja",
    "glyph-zh": "zh",
}


def invoke(action: str, **params: Any) -> Any:
    payload = json.dumps({"action": action, "version": 6, "params": params}).encode()
    request = Request(
        ANKI_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=10) as response:
        result = json.load(response)
    if result.get("error"):
        raise RuntimeError(f"AnkiConnect error for {action}: {result['error']}")
    return result["result"]


def chinese_template(template: str) -> str:
    """Remove Japanese-only rendering from the shared template."""
    return (
        template.replace('lang="ja"', 'lang="zh"')
        .replace("{{furigana:example_sentence}}", "{{example_sentence}}")
        .replace("{{furigana:vocab_ruby}}", "{{vocab_ruby}}")
    )


def create_clone(name: str, language: str, fields: list[str], templates: dict[str, dict[str, str]], css: str) -> bool:
    existing = invoke("modelNames")
    if name in existing:
        print(f"{name} already exists; skipping")
        return False

    card_templates = []
    for template_name, template in templates.items():
        front = template["Front"]
        back = template["Back"]
        if language == "zh":
            front = chinese_template(front)
            back = chinese_template(back)
        card_templates.append({
            "Name": template_name,
            "Front": front,
            "Back": back,
        })

    invoke(
        "createModel",
        modelName=name,
        inOrderFields=fields,
        css=css,
        isCloze=False,
        cardTemplates=card_templates,
    )
    print(f"Created {name} with {len(fields)} fields")
    return True


def main() -> None:
    fields = invoke("modelFieldNames", modelName=SOURCE_MODEL)
    templates = invoke("modelTemplates", modelName=SOURCE_MODEL)
    css = invoke("modelStyling", modelName=SOURCE_MODEL)["css"]

    for name, language in TARGETS.items():
        create_clone(name, language, fields, templates, css)


if __name__ == "__main__":
    main()
