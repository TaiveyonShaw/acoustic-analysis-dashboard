export default function ThestructRecordsTable({ records, selectedIndex, onSelect }) {
  if (!records?.length) {
    return <p className="muted">No records in file.</p>;
  }

  return (
    <table className="regions-table thestruct-records">
      <thead>
        <tr>
          <th>Record</th>
          <th>Aid</th>
          <th>Room</th>
          <th>Run</th>
          <th>Score</th>
          <th>Outlier</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr
            key={r.index}
            className={[
              r.isOutlier ? "outlier-row" : "",
              r.index === selectedIndex ? "selected-row" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelect?.(r.index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect?.(r.index);
            }}
          >
            <td>{r.label}</td>
            <td>{r.aid}</td>
            <td>{r.room}</td>
            <td>{r.run}</td>
            <td>{r.anomalyScore.toFixed(3)}</td>
            <td>{r.isOutlier ? "Yes" : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
