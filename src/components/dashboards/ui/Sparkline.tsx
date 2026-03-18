type SparklineProps = {
  points: number[];
};

export default function Sparkline(props: SparklineProps) {
  const w = 120;
  const h = 36;
  const pad = 3;
  const min = Math.min(...props.points);
  const max = Math.max(...props.points);
  const span = Math.max(1, max - min);
  const step = props.points.length <= 1 ? 0 : (w - pad * 2) / (props.points.length - 1);

  const d = props.points
    .map((p, i) => {
      const x = pad + step * i;
      const y = pad + (h - pad * 2) * (1 - (p - min) / span);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg class="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend">
      <path class="spark-path" d={d} />
    </svg>
  );
}

