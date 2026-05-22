import { useCallback, useEffect, useRef, useState } from "react";
import {
  setupCanvas,
  plotRectComparison,
  COMPARISON_CHART_HEIGHT,
  drawPolarAccuracy,
  drawAzimuthLineChart,
} from "../canvas/draw";
import { useChartRedraw } from "../hooks/useChartRedraw";
import { getMetricMeta, VALUE_METRICS } from "../utils/metrics";
import {
  buildRecordComparisonLegend,
  defaultLegendVisibility,
  LEGEND_IDS,
} from "../utils/chartLegend";
import ChartLegend from "./ChartLegend";
import AzimuthValuesPanel from "./AzimuthValuesPanel";

const VALUE_MATRICES = (matrices) => ({
  normILD: matrices?.normILD,
  rawILD: matrices?.rawILD,
  normITD: matrices?.normITD,
  rawITD: matrices?.rawITD,
});

export default function DirectionAccuracyChart({ directionAccuracy, selected, matrices, theme }) {
  const polarRef = useRef(null);
  const profileRef = useRef(null);
  const hasReference = directionAccuracy?.hasReference;
  const [metric, setMetric] = useState("normILD");
  const [freqIdx, setFreqIdx] = useState(() =>
    Math.floor((selected?.freqs?.length ?? 28) / 2)
  );
  const metricMeta = getMetricMeta(metric);
  const [legendVisible, setLegendVisible] = useState(() =>
    defaultLegendVisibility({ includeReference: true })
  );
  useEffect(() => {
    setFreqIdx(Math.floor((selected?.freqs?.length ?? 28) / 2));
  }, [selected?.index, selected?.freqs?.length]);

  useEffect(() => {
    setLegendVisible(defaultLegendVisibility({ includeReference: hasReference }));
  }, [selected?.index, directionAccuracy?.referenceLabel, metric, hasReference]);

  const toggleLegend = (id) => {
    setLegendVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const drawPolar = useCallback(() => {
    const canvas = polarRef.current;
    if (!canvas || !hasReference) return;
    const { ctx, width, height } = setupCanvas(canvas, 320);
    drawPolarAccuracy(ctx, width, height, directionAccuracy.perDirection);
  }, [directionAccuracy, hasReference]);

  const drawProfile = useCallback(() => {
    const canvas = profileRef.current;
    const matrix = matrices?.[metric];
    if (!canvas || !hasReference || !matrix) return;
    const { ctx, width, height } = setupCanvas(canvas, COMPARISON_CHART_HEIGHT);
    const rect = plotRectComparison(width, height);
    const az = selected.azimuths;
    const fi = Math.min(freqIdx, (selected.freqs?.length ?? 1) - 1);
    const measured = matrix.map((row) => row[fi]);
    const reference = directionAccuracy.referenceMatrices?.[metric]?.map((row) => row[fi]);
    drawAzimuthLineChart(ctx, rect, az, measured, width, height, {
      yLabel: metricMeta.yLabel,
      reference: legendVisible[LEGEND_IDS.reference] ? reference : null,
      showPrimary: legendVisible[LEGEND_IDS.selected],
      comparisonLayout: true,
    });
  }, [directionAccuracy, matrices, selected, freqIdx, legendVisible, hasReference, metric, metricMeta.yLabel]);

  useChartRedraw(polarRef, drawPolar, [drawPolar, theme]);
  useChartRedraw(profileRef, drawProfile, [drawProfile, theme]);

  const sorted = hasReference
    ? [...directionAccuracy.perDirection].sort((a, b) => b.accuracyPct - a.accuracyPct)
    : [];
  const worst = hasReference
    ? [...directionAccuracy.perDirection].sort((a, b) => a.accuracyPct - b.accuracyPct)[0]
    : null;

  const comparisonLegendItems = buildRecordComparisonLegend(legendVisible, {
    showReference: hasReference,
  });

  const valuesPanel = (
    <AzimuthValuesPanel
      matrices={VALUE_MATRICES(matrices)}
      azimuths={selected?.azimuths}
      freqs={selected?.freqs}
      referenceMatrices={
        hasReference ? directionAccuracy.referenceMatrices : undefined
      }
      showReferenceLegend={hasReference}
      theme={theme}
      compact={hasReference}
      metric={metric}
      onMetricChange={setMetric}
      showMetricControl={!hasReference}
      chartTitle={`${metricMeta.label} vs frequency`}
      legendVisible={hasReference ? legendVisible : undefined}
      onLegendToggle={hasReference ? toggleLegend : undefined}
      hideLegend={hasReference}
    />
  );

  return (
    <section className="chart-card direction-accuracy">
      <h3>Direction accuracy</h3>

      {hasReference ? (
        <>
          <p className="muted">
            Compares <strong>{selected?.aid}</strong> to unaided reference (
            {directionAccuracy.referenceLabel}). Higher % = spatial cues closer to baseline
            at that source direction.
          </p>

          <div className="accuracy-summary">
            <div className="metric-inline">
              <span className="metric-label">Overall</span>
              <span className="metric-value">{directionAccuracy.overallAccuracyPct}%</span>
            </div>
            {worst && (
              <div className="metric-inline warn">
                <span className="metric-label">Weakest direction</span>
                <span className="metric-value">
                  {worst.azimuth}° ({worst.accuracyPct}%)
                </span>
              </div>
            )}
          </div>

          <div className="direction-charts-stack">
            <div className="direction-shared-controls direction-chart-header direction-chart-header--title-inline">
              <h4 className="direction-shared-heading">Charts</h4>
              <label className="field inline-field direction-metric-select">
                <span>Metric</span>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  aria-label="Metric for profile and values charts"
                >
                  {VALUE_METRICS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div
              className="direction-charts-pair"
              style={{ "--comparison-chart-height": `${COMPARISON_CHART_HEIGHT}px` }}
            >
              <div className="comparison-chart-column profile-wrap">
                <div className="direction-chart-header direction-chart-header--title-inline">
                  <h4>{metricMeta.label} vs azimuth</h4>
                  <div className="direction-chart-header-controls">
                    <label className="field inline-field direction-freq-select">
                      <span>Frequency</span>
                      <select
                        value={freqIdx}
                        onChange={(e) => setFreqIdx(Number(e.target.value))}
                        aria-label="Frequency for azimuth profile"
                      >
                        {selected?.freqs?.map((f, i) => (
                          <option key={f} value={i}>
                            {Math.round(f)} Hz
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="chart-canvas-wrap comparison-chart-plot">
                  <canvas ref={profileRef} className="chart-canvas" />
                </div>
              </div>
              <div className="comparison-chart-column values-by-azimuth-wrap">
                {valuesPanel}
              </div>
            </div>
            <ChartLegend items={comparisonLegendItems} onToggle={toggleLegend} />
            <div className="polar-wrap">
              <h4>Polar map</h4>
              <p className="muted small">Spokes mark each source direction (top = front)</p>
              <div className="chart-canvas-wrap">
                <canvas ref={polarRef} className="chart-canvas polar-canvas" />
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="direction-table">
              <thead>
                <tr>
                  <th>Azimuth</th>
                  <th>Accuracy</th>
                  <th>ILD err</th>
                  <th>ITD err</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => (
                  <tr key={d.azimuth} className={d.accuracyPct < 50 ? "low-accuracy" : ""}>
                    <td>{d.azimuth}°</td>
                    <td>{d.accuracyPct}%</td>
                    <td>{d.ildError}</td>
                    <td>{d.itdError}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {directionAccuracy?.reason && (
            <p className="muted">{directionAccuracy.reason}</p>
          )}
          <div className="values-by-azimuth-wrap values-by-azimuth-wrap--solo">
            <p className="muted panel-lead">
              Pick a source direction and metric; frequency on the horizontal axis (0° = front).
            </p>
            {valuesPanel}
          </div>
        </>
      )}
    </section>
  );
}
