import type { NormalizedVocabInfo, VocabInfoFromAPI } from "./types";

// Get full AI word profile from Open AI
export const getAIVocabInfo = async (tl: string = "Japanese", term: string) => {
  try {
    // const response = await fetch(url, {options});
    const response = await fetch("http://localhost:8000/vocab/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tl, term }), //ES6 shorthand, just write tl instead of tl:tl
    });

    const data: VocabInfoFromAPI = await response.json(); // Have to await the JSON parse to get your actual data object

    // Normalize the data from the backend
    const normalizedData: NormalizedVocabInfo = {
      term: data.term,
      pronunciation: data.pronunciation,
      partOfSpeech: data.part_of_speech,
      tlDefinition: data.tl_definition,
      engDefinition: data.eng_definition,
      usageNotes: data.usage_notes,
      cautions: data.cautions,
      exampleSentences: data.example_sentences,
    };

    return normalizedData;
  } catch (err) {
    console.error(err);
  }
};
