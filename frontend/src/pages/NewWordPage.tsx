import { useEffect, useState, type ChangeEvent } from "react";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import DefinitionCard from "../components/DefinitionCard";
import SentenceCard from "../components/SentenceCard";
import { getAIVocabInfo } from "../api/client";
import { type ExampleSentence, type NormalizedVocabInfo } from "../api/types";

// Shape used in UI state: API sentence + toggle flag
type ExampleSentenceAdd = ExampleSentence & {
  toAdd: boolean;
};

function NewWordPage() {
  const [term, setTerm] = useState("");
  const [vocabInfo, setVocabInfo] = useState<NormalizedVocabInfo | undefined>(
    undefined,
  );
  // useState can be NormalizedVocab or null, defaulted to null.
  const [sentences, setSentences] = useState<ExampleSentenceAdd[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGetVocab = async () => {
    setLoading(true);
    try {
      const data = await getAIVocabInfo("Japanese", term);
      setVocabInfo(data);
      setSentences(
        data?.exampleSentences.map((s) => ({
          ...s,
          toAdd: false,
        })) ?? [],
      ); // If data exists use map to add a toAdd key, otherwise use empty array.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  const toggleToAdd = (idx: number) =>
    setSentences((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], toAdd: !next[idx].toAdd };
      return next;
    });

  // When [definition] changes, then run useEffect(), can have multiple
  useEffect(() => {
    console.log(vocabInfo);
  }, [vocabInfo]);

  return (
    <div>
      <h1 className="mb-6 text-5xl font-bold">mnemo</h1>
      <TextInput
        value={term}
        onChange={handleChange}
        placeholder="... means?"
      ></TextInput>
      <Button onClick={handleGetVocab} text="mnemo!"></Button>
      {loading && <p>loading...</p>}
      {vocabInfo && <DefinitionCard {...vocabInfo} />}
      {sentences.map(({ sentence, translation, toAdd }, index) => (
        <SentenceCard
          key={index}
          sentence={sentence}
          translation={translation}
          toAdd={toAdd}
          onToggleToAdd={() => toggleToAdd(index)}
        />
      ))}
    </div>
  );
}

export default NewWordPage;
