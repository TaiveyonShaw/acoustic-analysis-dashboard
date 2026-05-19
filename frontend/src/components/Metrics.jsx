export default function Metrics({ summary }) {
  if (!summary) return null;
  const items = [
    { label: "Duration", value: `${summary.durationS.toFixed(2)} s` },
    { label: "Sample rate", value: `${summary.sampleRate.toLocaleString()} Hz` },
    {
      label: "Outlier frames",
      value: `${summary.nOutliers} / ${summary.nFrames}`,
    },
    { label: "Outlier %", value: `${summary.outlierPct}%` },
    { label: "Regions", value: String(summary.nRegions) },
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
