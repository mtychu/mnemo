// Example sentence generated from API
export type ExampleSentence = {
  sentence: string;
  translation: string;
};

export type VocabInfoFromAPI = {
  term: string;
  pronunciation: string;
  part_of_speech: string;
  tl_definition: string;
  eng_definition: string;
  usage_notes: string;
  cautions: string;
  example_sentences: ExampleSentence[];
};

export type NormalizedVocabInfo = {
  term: string;
  pronunciation: string;
  partOfSpeech: string;
  tlDefinition: string;
  engDefinition: string;
  usageNotes: string;
  cautions: string;
  exampleSentences: ExampleSentence[];
};
