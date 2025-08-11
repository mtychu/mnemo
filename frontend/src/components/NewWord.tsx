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
      <input
        type="text"
        value={term}
        onChange={handleChange}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      ></input>
      <button
        className="border-purple-200 text-white-500 hover:border-transparent hover:bg-purple-600 hover:text-white active:bg-purple-700 ..."
        onClick={handleSubmit}
      >
        Submit
      </button>
      {loading && <p>Loading...</p>}
      <div className="bg-white shadow-md mt-2 rounded-lg p-6 max-w-sm">
        <h2 className="text-xl font-semibold text-gray-800">
          毎日コーヒーを飲みます。
        </h2>
        <p className="text-gray-600">I drink coffee every day.</p>
      </div>
    </div>
  );
}

export default NewWord;
