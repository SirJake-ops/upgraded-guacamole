type KpiCardProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: "teal" | "indigo" | "amber" | "rose";
};

export default function KpiCard(props: KpiCardProps) {
  return (
    <div class={`kpi kpi-${props.tone ?? "teal"}`}>
      <div class="kpi-top">
        <div class="kpi-label">{props.label}</div>
        {props.delta ? <div class="kpi-delta">{props.delta}</div> : null}
      </div>
      <div class="kpi-value">{props.value}</div>
    </div>
  );
}

