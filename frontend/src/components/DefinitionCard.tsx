export type DefinitionCardProps = {
  term?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  tlDefinition?: string;
  engDefinition?: string;
  usageNotes?: string;
  cautions?: string;
};

// Consider passing in a DefinitionProps type instead of each thing individually, it might look something like:
// function Definition({ definition }: { definition: DefinitionProps }) {
//   const {
//     term,
//     pronunciation,
//     partOfSpeech,
//     tlDefinition,
//     engDefinition,
//     usageNotes,
//     cautions,
//   } = definition;

//   return <div>{term}</div>;
// }

function DefinitionCard({
  term,
  pronunciation,
  partOfSpeech,
  tlDefinition,
  engDefinition,
  usageNotes,
  cautions,
}: DefinitionCardProps) {
  return (
    <div className="mb-2 mt-5 max-w-xl rounded-2xl border p-4">
      <h2>{term}</h2>
      <p>{pronunciation}</p>
      <p>{partOfSpeech}</p>
      <p>{tlDefinition}</p>
      <p>{engDefinition}</p>
      <p> - </p>
      <p>
        {usageNotes} {cautions}
      </p>
    </div>
  );
}

export default DefinitionCard;
