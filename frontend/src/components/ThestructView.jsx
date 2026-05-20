import HeatmapChart from "./HeatmapChart";
import ThestructRecordsTable from "./ThestructRecordsTable";

export default function ThestructView({ data, onSelectRecord }) {
  const { selected, matrices, records, summary } = data;
  const ildMask = selected?.cellOutliers?.masks?.normILD;
  const itdMask = selected?.cellOutliers?.masks?.normITD;

  return (
    <div className="tab-panel thestruct-panel">
      <section className="chart-card record-summary">
        <h3>Selected record</h3>
        <p>
          <strong>{selected?.label}</strong>
          <span className="muted">
            {" "}
            — subject {selected?.subject}, condition {selected?.cond}
          </span>
        </p>
        <p className="muted">
          {summary?.nAzimuths} azimuths × {summary?.nFreqs} frequency bins
        </p>
      </section>

      <div className="chart-row">
        <HeatmapChart
          title="Normalized ILD (dB)"
          matrix={matrices?.normILD}
          xLabels={selected?.freqs}
          yLabels={selected?.azimuths}
          xLabel="Frequency (Hz)"
          yLabel="Azimuth (°)"
          outlierMask={ildMask}
        />
        <HeatmapChart
          title="Normalized ITD (µs)"
          matrix={matrices?.normITD}
          xLabels={selected?.freqs}
          yLabels={selected?.azimuths}
          xLabel="Frequency (Hz)"
          yLabel="Azimuth (°)"
          outlierMask={itdMask}
        />
      </div>

      <div className="chart-row">
        <HeatmapChart
          title="Raw ILD (dB)"
          matrix={matrices?.rawILD}
          xLabels={selected?.freqs}
          yLabels={selected?.azimuths}
          xLabel="Frequency (Hz)"
          yLabel="Azimuth (°)"
        />
        <HeatmapChart
          title="Raw ITD (µs)"
          matrix={matrices?.rawITD}
          xLabels={selected?.freqs}
          yLabels={selected?.azimuths}
          xLabel="Frequency (Hz)"
          yLabel="Azimuth (°)"
        />
      </div>

      <section className="chart-card">
        <h3>All records ({records?.length})</h3>
        <p className="muted">
          Click a row to load that hearing-aid / room / run combination. Outliers are
          flagged across the {records?.length} records in this file.
        </p>
        <ThestructRecordsTable
          records={records}
          selectedIndex={summary?.selectedIndex}
          onSelect={onSelectRecord}
        />
      </section>
    </div>
  );
}
