import { useEffect, useMemo, useState } from "react";
import AzimuthMiniChart from "./AzimuthMiniChart";
import ChartLegend from "./ChartLegend";
import { sortedAzimuthSlots, azimuthSlotKey } from "../utils/azimuthSlots";
import {
  buildRecordComparisonLegend,
  defaultLegendVisibility,
  LEGEND_IDS,
} from "../utils/chartLegend";
import { COMPARISON_CHART_HEIGHT } from "../canvas/draw";
import { getMetricMeta, VALUE_METRICS } from "../utils/metrics";
import { FREQ_AXIS_SCALES, freqAxisHint } from "../utils/freqAxisScale";

const CHART_HEIGHT = 420;

export default function AzimuthValuesPanel({
  matrices,
  azimuths,
  freqs,
  referenceMatrices,
  showReferenceLegend = false,
  theme,
  compact = false,
  metric: metricProp,
  onMetricChange,
  showMetricControl = true,
  chartTitle,
  legendVisible: legendVisibleProp,
  onLegendToggle,
  hideLegend = false,
}) {
  const [metricInternal, setMetricInternal] = useState("normILD");
  const metric = metricProp ?? metricInternal;
  const setMetric = onMetricChange ?? setMetricInternal;
  const slots = useMemo(() => sortedAzimuthSlots(azimuths), [azimuths]);
  const [azimuthKey, setAzimuthKey] = useState("");
  const [freqAxisScale, setFreqAxisScale] = useState("mel");
  const [legendInternal, setLegendInternal] = useState(() =>
    defaultLegendVisibility({ includeReference: showReferenceLegend })
  );
  const legendVisible = legendVisibleProp ?? legendInternal;
  const toggleLegend =
    onLegendToggle ??
    ((id) => setLegendInternal((prev) => ({ ...prev, [id]: !prev[id] })));

  useEffect(() => {
    if (!slots.length) {
      setAzimuthKey("");
      return;
    }
    const mid = slots[Math.floor(slots.length / 2)];
    setAzimuthKey(azimuthSlotKey(mid));
  }, [azimuths, slots]);

  useEffect(() => {
    if (legendVisibleProp == null) {
      setLegendInternal(defaultLegendVisibility({ includeReference: showReferenceLegend }));
    }
  }, [metric, azimuthKey, showReferenceLegend, legendVisibleProp]);

  const metricMeta = getMetricMeta(metric);
  const matrix = matrices?.[metric];
  const referenceMatrix = referenceMatrices?.[metric];
  const activeSlot = slots.find((s) => azimuthSlotKey(s) === azimuthKey) ?? slots[0];

  const legendItems = buildRecordComparisonLegend(legendVisible, {
    showReference: showReferenceLegend && !!referenceMatrix,
  });

  const title = chartTitle ?? `${metricMeta.label} vs frequency`;

  const azimuthSelect = (
    <label className="field inline-field direction-az-select">
      <span>Azimuth</span>
      <select
        value={azimuthKey}
        onChange={(e) => setAzimuthKey(e.target.value)}
        aria-label="Source azimuth"
      >
        {slots.map((slot) => {
          const key = azimuthSlotKey(slot);
          return (
            <option key={key} value={key}>
              {slot.az}°
            </option>
          );
        })}
      </select>
    </label>
  );

  const freqScaleSelect = (
    <label className="field inline-field direction-freq-scale-select">
      <span>Freq. axis</span>
      <select
        value={freqAxisScale}
        onChange={(e) => setFreqAxisScale(e.target.value)}
        aria-label="Frequency axis scale"
      >
        {FREQ_AXIS_SCALES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );

  const metricSelect = showMetricControl && (
    <label className="field inline-field direction-metric-select">
      <span>Metric</span>
      <select value={metric} onChange={(e) => setMetric(e.target.value)}>
        {VALUE_METRICS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className={`azimuth-values-panel${compact ? " azimuth-values-panel--compact" : ""}`}>
      <div className="direction-chart-header direction-chart-header--title-inline">
        <h4>{title}</h4>
        <div className="direction-chart-header-controls">
          {metricSelect}
          {freqScaleSelect}
          {azimuthSelect}
        </div>
      </div>

      {!compact && (
        <>
          <p className="muted small azimuth-chart-hint azimuth-ild-explainer">
            <strong>Raw</strong> is the value stored in the MAT file as measured.{" "}
            <strong>Normalized</strong> is{" "}
            <code>raw − correction</code>: a fixed 11×28 offset for that hearing-aid type
            (Occ/Open), precomputed in the OSF data—not “percent of raw” and not the unaided
            baseline. For <strong>Unaid</strong> records, raw and normalized are almost the same.
            Use the <strong>Metric</strong> dropdown to switch between them.
          </p>
          <p className="muted small azimuth-chart-hint">
        {freqAxisHint(freqAxisScale)}; {metricMeta.yLabel} on the vertical axis (min at bottom,
        max at top).
          </p>
        </>
      )}

      {activeSlot && (
        <>
          <AzimuthMiniChart
            azimuth={activeSlot.az}
            freqs={freqs}
            values={matrix?.[activeSlot.rowIndex]}
            referenceValues={referenceMatrix?.[activeSlot.rowIndex]}
            yLabel={metricMeta.yLabel}
            showAxisLabels
            showHeading={false}
            detailed={!compact}
            comparisonLayout={compact}
            freqAxisScale={freqAxisScale}
            visibility={{
              primary: legendVisible[LEGEND_IDS.selected],
              reference: legendVisible[LEGEND_IDS.reference],
            }}
            canvasHeight={compact ? COMPARISON_CHART_HEIGHT : CHART_HEIGHT}
            theme={theme}
          />
          {!hideLegend && legendItems.length > 0 && (
            <ChartLegend items={legendItems} onToggle={toggleLegend} />
          )}
        </>
      )}
    </div>
  );
}
