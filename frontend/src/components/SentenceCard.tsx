import { useState } from "react";
import type { ExampleSentence } from "../api/types";

type SentenceCardProps = ExampleSentence & {
  toAdd: boolean;
  onToggleToAdd: () => void;
};

function SentenceCard({
  sentence = "毎日コーヒーを飲みます。",
  translation = "I drink coffee every day.",
  toAdd = false,
  onToggleToAdd,
}: SentenceCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <div className="group mb-2 rounded-2xl border p-4">
      <button
        type="button"
        className="m-0 border-0 bg-transparent p-0 text-inherit hover:text-inherit focus:outline-none"
        aria-expanded={showTranslation}
        aria-controls="translation"
        onClick={() => setShowTranslation((show) => !show)}
      >
        <h2>{sentence}</h2>
      </button>
      <button
        className="m-0 border-0 bg-transparent p-0 text-inherit hover:text-inherit focus:outline-none"
        onClick={onToggleToAdd}
      >
        {toAdd ? "✅" : "➕"}
      </button>
      <p className={showTranslation ? "italic text-slate-600" : "hidden"}>
        {translation}
      </p>
    </div>
  );
}

export default SentenceCard;
