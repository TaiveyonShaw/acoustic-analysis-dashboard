import HeatmapChart from "./HeatmapChart";
import DirectionAccuracyChart from "./DirectionAccuracyChart";
import ThestructRecordsTable from "./ThestructRecordsTable";

export default function ThestructView({ data, onSelectRecord, theme }) {
  const { selected, matrices, records, summary, directionAccuracy } = data;
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

      <DirectionAccuracyChart
        directionAccuracy={directionAccuracy}
        selected={selected}
        matrices={matrices}
        theme={theme}
      />

      {directionAccuracy?.hasReference && directionAccuracy.errorMatrices && (
        <div className="chart-row">
          <HeatmapChart
            title="ILD error vs unaided (dB)"
            matrix={directionAccuracy.errorMatrices.normILD}
            xLabels={selected?.freqs}
            yLabels={selected?.azimuths}
            xLabel="Frequency (Hz)"
            yLabel="Azimuth (°)"
            theme={theme}
          />
          <HeatmapChart
            title="ITD error vs unaided (µs)"
            matrix={directionAccuracy.errorMatrices.normITD}
            xLabels={selected?.freqs}
            yLabels={selected?.azimuths}
            xLabel="Frequency (Hz)"
            yLabel="Azimuth (°)"
            theme={theme}
          />
        </div>
      )}

      <div className="chart-row">
        <HeatmapChart
          title="Normalized ILD (dB)"
          matrix={matrices?.normILD}
          xLabels={selected?.freqs}
          yLabels={selected?.azimuths}
          xLabel="Frequency (Hz)"
          yLabel="Azimuth (°)"
          outlierMask={ildMask}
          theme={theme}
        />
        <HeatmapChart
          title="Normalized ITD (µs)"
          matrix={matrices?.normITD}
          xLabels={selected?.freqs}
          yLabels={selected?.azimuths}
          xLabel="Frequency (Hz)"
          yLabel="Azimuth (°)"
          outlierMask={itdMask}
          theme={theme}
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
          theme={theme}
        />
        <HeatmapChart
          title="Raw ITD (µs)"
          matrix={matrices?.rawITD}
          xLabels={selected?.freqs}
          yLabels={selected?.azimuths}
          xLabel="Frequency (Hz)"
          yLabel="Azimuth (°)"
          theme={theme}
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
