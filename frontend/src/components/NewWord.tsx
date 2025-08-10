import { useEffect, useState, type ChangeEvent } from "react";

function NewWord() {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
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
      setDefinition(data);
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
  useEffect(() => {
    console.log(term);
  }, [term]);

  useEffect(() => {
    console.log(definition);
  }, [definition]);

  return (
    <div>
      <input type="text" value={term} onChange={handleChange}></input>
      <button onClick={handleSubmit}>Submit</button>
      {loading && <p>Loading...</p>}
    </div>
  );
}

export default NewWord;
