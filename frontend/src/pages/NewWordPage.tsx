import { useEffect, useState, type ChangeEvent } from "react";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import SentenceCard from "../components/SentenceCard";
import Definition, { type DefinitionProps } from "../components/Definition";

function NewWordPage() {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState<DefinitionProps | null>(null);
  // useState can be DefinitionProps or null, defaulted to null.
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // const response = await fetch(url, options);
      const response = await fetch("http://localhost:8000/vocab/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tl: "Japanese", term }),
        //'term' instead of 'term: term' is ES6 shorthand
      });
      // Have to await the JSON parse to get your actual data object
      const data = await response.json();
      const normalizedDefinition: DefinitionProps = {
        term: data.term,
        pronounciation: data.pronounciation,
        partOfSpeech: data.part_of_speech,
        tlDefinition: data.tl_definition,
        engDefinition: data.eng_definition,
        usageNotes: data.usage_notes,
        cautions: data.cautions,
      };

      setDefinition(normalizedDefinition);
      setSentences(data.example_sentences);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  // When [word] changes, then run useEffect(), can have multiple
  // useEffect(() => {
  //   console.log(term);
  // }, [term]);

  useEffect(() => {
    console.log(definition);
  }, [definition]);

  return (
    <div>
      <TextInput
        value={term}
        onChange={handleChange}
        placeholder="what does it mean?"
      ></TextInput>
      <Button onClick={handleSubmit} text="mnemo!"></Button>
      {loading && <p>Loading...</p>}
      {definition && <Definition {...definition} />}
      {sentences.map(({ sentence, translation }, index) => (
        <SentenceCard
          key={index}
          exampleSentence={sentence}
          translation={translation}
        />
      ))}
    </div>
  );
}

export default NewWordPage;
