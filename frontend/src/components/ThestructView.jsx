import DirectionAccuracyChart from "./DirectionAccuracyChart";
import SpatialMapGallery from "./SpatialMapGallery";

export default function ThestructView({ data, theme }) {
  const { selected, matrices, directionAccuracy } = data;

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
