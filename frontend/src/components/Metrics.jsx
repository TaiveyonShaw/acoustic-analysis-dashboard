export default function Metrics({ summary, dataType }) {
  if (!summary) return null;

  const items =
    dataType === "thestruct"
      ? [
          { label: "Subject records", value: String(summary.nRecords) },
          {
            label: "Outlier records",
            value: `${summary.nOutliers} / ${summary.nRecords}`,
          },
          { label: "Outlier %", value: `${summary.outlierPct}%` },
          { label: "Azimuths", value: String(summary.nAzimuths) },
          { label: "Freq bins", value: String(summary.nFreqs) },
        ]
      : [
          { label: "Duration", value: `${summary.durationS.toFixed(2)} s` },
          { label: "Sample rate", value: `${summary.sampleRate.toLocaleString()} Hz` },
          {
            label: "Outlier frames",
            value: `${summary.nOutliers} / ${summary.nFrames}`,
          },
          { label: "Outlier %", value: `${summary.outlierPct}%` },
          { label: "Regions", value: String(summary.nRegions ?? 0) },
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
