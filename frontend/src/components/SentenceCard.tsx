import { useState } from "react";
import type { ExampleSentenceAdd } from "../api/types";

function SentenceCard({
  sentence = "毎日コーヒーを飲みます。",
  translation = "I drink coffee every day.",
  toAdd = false,
}: ExampleSentenceAdd) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <div className="group mb-2 rounded-2xl border p-4">
      <button
        type="button"
        className="m-0 border-0 bg-transparent p-0 text-inherit hover:text-inherit focus:outline-none"
        aria-expanded={showTranslation}
        aria-controls="translation"
        onClick={() => setShowTranslation((open) => !open)}
      >
        <h2>{sentence}</h2>
      </button>
      <p className={showTranslation ? "italic text-slate-600" : "hidden"}>
        {translation}
      </p>
    </div>
  );
}

export default SentenceCard;
