export type DefinitionProps = {
  term?: string;
  pronounciation?: string;
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
//     pronounciation,
//     partOfSpeech,
//     tlDefinition,
//     engDefinition,
//     usageNotes,
//     cautions,
//   } = definition;

//   return <div>{term}</div>;
// }

function Definition({
  term,
  pronounciation,
  partOfSpeech,
  tlDefinition,
  engDefinition,
  usageNotes,
  cautions,
}: DefinitionProps) {
  return (
    <div className="p-4 border rounded mb-2">
      <h2>{term}</h2>
      <p>{pronounciation}</p>
      <p>{partOfSpeech}</p>
      <p>
        {tlDefinition} | {engDefinition}
      </p>
      <p>
        {usageNotes} {cautions}
      </p>
    </div>
  );
}

export default Definition;
