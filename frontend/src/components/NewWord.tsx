import { useEffect, useState, type ChangeEvent } from "react";

function NewWord() {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // const response = await fetch(url, options);
      const response = await fetch("http://localhost:8000/get-definition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lang: "Japanese", word }), //word instead of word: word is ES6 shorthand
      });
      // Have to await the JSON parse to get your actual data object
      const data = await response.json();
      setDefinition(data.output);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  // When [word] changes, then run useEffect(), can have multiple
  useEffect(() => {
    console.log(word);
  }, [word]);

  useEffect(() => {
    console.log(definition);
  }, [definition]);

  return (
    <div>
      <input type="text" value={word} onChange={handleChange}></input>
      <button onClick={handleSubmit}>Submit</button>
      {loading && <p>Loading...</p>}
    </div>
  );
}

export default NewWord;
