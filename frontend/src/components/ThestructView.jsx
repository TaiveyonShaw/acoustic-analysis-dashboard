import DirectionAccuracyChart from "./DirectionAccuracyChart";
import RecordSelector from "./RecordSelector";
import SpatialMapGallery from "./SpatialMapGallery";

export default function ThestructView({
  data,
  theme,
  records,
  recordIndex,
  onRecordIndex,
  loading,
}) {
  const { selected, matrices, directionAccuracy } = data;

  return (
    <div className="tab-panel thestruct-panel">
      <section className="chart-card record-summary">
        <div className="record-summary-header">
          <h3>Selected record</h3>
          <RecordSelector
            records={records}
            recordIndex={recordIndex}
            onRecordIndex={onRecordIndex}
            loading={loading}
          />
        </div>
        <p>
          <strong>{selected?.label}</strong>
          <span className="muted">
            {" "}
            — subject {selected?.subject}, condition {selected?.cond}
          </span>
        </p>
      </section>

      <DirectionAccuracyChart
        directionAccuracy={directionAccuracy}
        selected={selected}
        matrices={matrices}
        theme={theme}
      />

      <SpatialMapGallery
        matrices={matrices}
        azimuths={selected?.azimuths}
        freqs={selected?.freqs}
        theme={theme}
      />
    </div>
  );
}
