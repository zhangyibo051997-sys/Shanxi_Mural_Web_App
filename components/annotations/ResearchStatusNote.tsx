type ResearchStatusNoteProps = {
  text: string;
};

export default function ResearchStatusNote({ text }: ResearchStatusNoteProps) {
  return (
    <p className="type-caption text-ink/70">{text}</p>
  );
}
