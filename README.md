# Mnemo

## Example Usage

Imagine you're at a language exchange event, and you encounter a word you don't know while chatting with a new friend. Instead of awkwardly fumbling with your phone to look up the word, jotting it down in your notes, and later forgetting to add it to Anki, you can simply ask your friend to write the word directly into the app.

The app will then reach out to an AI service to fetch a detailed definition, including nuances and at least three example sentences. You can quickly review these sentences and select the one(s) that best fit the **n+1 principle**—a sentence where the new word is the only unfamiliar term. Alternatively, you can ask your friend to write down what they just said or even record their voice for added context.

The app will handle the card generation for you, creating a flashcard that includes the word, its nuances, and any additional information. In future iterations, the app could support multiple languages, various input methods, and even features like recording your location or capturing images of your surroundings to enhance word retention.

---

## Intended Tech Stack

### Frontend

- **React**: A popular JavaScript library for building user interfaces. Its component-based architecture makes it easier to manage complex UIs.

### Backend

- **MongoDB**: A NoSQL database that is flexible and scalable, ideal for storing user data, flashcards, and app configurations.
- **FastAPI**: A modern Python web framework known for its speed and ease of use. It's great for building APIs and integrates well with Python's ecosystem.

### Text-to-Speech (TTS)

- **OpenAI Whisper**: Known for its advanced capabilities in speech-to-text and text-to-speech.

### Integration with Anki

- **AnkiConnect**: A plugin for Anki that allows external applications to interact with Anki via a JSON-RPC API. This will be crucial for automating the card creation process in future versions.

### Deployment

- **Docker**: For containerization and easy deployment. It ensures that the app runs consistently across different environments.
- **AWS**: For hosting the web application and backend services.

---
