export default function Metrics({ summary }) {
  if (!summary) return null;

  const items = [
    { label: "Subject records", value: String(summary.nRecords) },
    {
      label: "Direction accuracy",
      value:
        summary.directionAccuracyPct != null ? `${summary.directionAccuracyPct}%` : "—",
    },
  ];

  return (
    <div className="metrics">
      {items.map((m) => (
        <div key={m.label} className="metric">
          <span className="metric-label">{m.label}</span>
          <span className="metric-value">{m.value}</span>
        </div>
      ))}
    </div>
  );
}
