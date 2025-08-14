type SentenceCardProps = {
  exampleSentence?: string;
  translation?: string;
};

function SentenceCard({
  exampleSentence = "毎日コーヒーを飲みます。",
  translation = "I drink coffee every day.",
}: SentenceCardProps) {
  return (
    <div className="p-4 border rounded mb-2">
      <h2>{exampleSentence}</h2>
      <p>{translation}</p>
    </div>
  );
}

export default SentenceCard;
