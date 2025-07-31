import { useEffect, useState, type ChangeEvent } from "react";
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: "",
  dangerouslyAllowBrowser: true,
});

function NewWord() {
  const [word, setWord] = useState("");

  const handleSubmit = async () => {
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: "Write a one-sentence bedtime story about a unicorn.",
    });

    console.log(response);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  useEffect(() => {
    console.log(word);
  }, [word]);

  return (
    <div>
      <input type="text" value={word} onChange={handleChange}></input>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default NewWord;
