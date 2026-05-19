export default function RegionsTable({ regions }) {
  if (!regions?.length) {
    return <p className="empty-hint">No outlier regions with current settings.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Start (s)</th>
            <th>End (s)</th>
            <th>Duration (s)</th>
            <th>Frames</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r, i) => (
            <tr key={i}>
              <td>{r.start_s.toFixed(3)}</td>
              <td>{r.end_s.toFixed(3)}</td>
              <td>{(r.end_s - r.start_s).toFixed(3)}</td>
              <td>{r.n_frames}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
