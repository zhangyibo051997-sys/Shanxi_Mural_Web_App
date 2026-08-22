type ReadingGuideProps = {
  steps: string[];
};

export default function ReadingGuide({ steps }: ReadingGuideProps) {
  if (!steps.length) return null;

  return (
    <ol className="space-y-1.5">
      {steps.map((step, index) => (
        <li
          key={`${index}-${step}`}
          className="type-body flex gap-2 text-ink"
        >
          <span className="type-meta mt-0.5 shrink-0 text-gold">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
