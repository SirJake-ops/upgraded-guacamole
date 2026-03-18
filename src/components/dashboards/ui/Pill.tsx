type PillTone = "neutral" | "good" | "warn" | "bad" | "info";

type PillProps = {
  text: string;
  tone?: PillTone;
};

export default function Pill(props: PillProps) {
  const tone = props.tone ?? "neutral";
  return <span class={`pill pill-${tone}`}>{props.text}</span>;
}

