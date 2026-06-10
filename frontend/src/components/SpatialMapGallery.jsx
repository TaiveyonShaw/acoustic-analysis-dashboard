import { useCallback, useRef, useState } from "react";
import { setupCanvas } from "../canvas/draw";
import { drawContourMap, drawHeatmap, plotRectSpatialMap } from "../canvas/spatialMaps";
import { useChartRedraw } from "../hooks/useChartRedraw";
import Surface3DView from "./Surface3DView";
import SwapAxesButton from "./SwapAxesButton";
import { FREQ_AXIS_SCALES } from "../utils/freqAxisScale";
import { getMetricMeta, VALUE_METRICS } from "../utils/metrics";

const MAP_HEIGHT = 260;
const HEATMAP_HEIGHT = 300;

const COMPARE_VIEWS = [
  {
    id: "contour",
    title: "Contour",
    blurb: "Iso-lines at equal ILD/ITD. Good for seeing thresholds and ridges without relying on color alone.",
  },
  {
    id: "surface3d",
    title: "3D wireframe",
    blurb: "Frequency (→), azimuth (depth), height = value. Drag to orbit and scroll to zoom.",
  },
];

function SpatialMapCanvas({ drawFn, height, theme }) {
  const canvasRef = useRef(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFn(canvas);
  }, [drawFn]);

  useChartRedraw(canvasRef, draw, [draw, theme]);

  return (
    <div className="chart-canvas-wrap spatial-map-canvas-wrap" style={{ minHeight: height }}>
      <canvas ref={canvasRef} className="chart-canvas" />
    </div>
  );
}

function CompareTile({ viewId, title, blurb, matrix, unit, theme }) {
  const drawFn = useCallback(
    (canvas) => {
      if (!matrix?.length) return;
      const { ctx, width, height } = setupCanvas(canvas, MAP_HEIGHT);
      const rect = plotRectSpatialMap(width, height);
      drawContourMap(ctx, rect, matrix, width, height, { unit, lo: undefined, hi: undefined });
    },
    [matrix, unit],
  );

  if (viewId === "surface3d") {
    return (
      <article className="spatial-map-tile">
        <h4>{title}</h4>
        <p className="muted small spatial-map-blurb">{blurb}</p>
        <Surface3DView matrix={matrix} unit={unit} theme={theme} height={MAP_HEIGHT} />
      </article>
    );
  }

  return (
    <article className="spatial-map-tile">
      <h4>{title}</h4>
      <p className="muted small spatial-map-blurb">{blurb}</p>
      <SpatialMapCanvas drawFn={drawFn} height={MAP_HEIGHT} theme={theme} />
    </article>
  );
}

export default function SpatialMapGallery({ matrices, azimuths, freqs, theme }) {
  const [metric, setMetric] = useState("normILD");
  const [freqAxisScale, setFreqAxisScale] = useState("mel");
  const [swapHeatmapAxes, setSwapHeatmapAxes] = useState(false);

  const metricMeta = getMetricMeta(metric);
  const matrix = matrices?.[metric];

  const heatmapDrawFn = useCallback(
    (canvas) => {
      if (!matrix?.length) return;
      const { ctx, width, height } = setupCanvas(canvas, HEATMAP_HEIGHT);
      const rect = plotRectSpatialMap(width, height);
      drawHeatmap(ctx, rect, matrix, width, height, {
        unit: metricMeta.yLabel,
        freqs,
        azimuths,
        freqAxisScale,
        swapAxes: swapHeatmapAxes,
      });
    },
    [matrix, metricMeta.yLabel, freqs, azimuths, freqAxisScale, swapHeatmapAxes],
  );

  if (!matrix?.length) return null;

  return (
    <section className="chart-card spatial-map-gallery">
      <div className="direction-chart-header direction-chart-header--title-inline">
        <div>
          <h3>Spatial maps (all 3 dimensions)</h3>
          <p className="muted small spatial-map-lead">
            Full {azimuths?.length ?? 11}×{freqs?.length ?? 28} grid — azimuth, frequency, and{" "}
            {metricMeta.yLabel} together.
          </p>
        </div>
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
      </div>

      <article className="spatial-map-tile spatial-map-tile--heatmap">
        <div className="direction-chart-header direction-chart-header--title-inline spatial-map-heatmap-header">
          <div>
            <h4>Heatmap</h4>
            <p className="muted small spatial-map-blurb">
              Color = value at each azimuth × frequency cell. Frequency axis uses the selected
              scale; swap puts frequency on the vertical axis.
            </p>
          </div>
          <div className="direction-chart-header-controls">
            <label className="field inline-field direction-freq-scale-select">
              <span>Freq. scale</span>
              <select
                value={freqAxisScale}
                onChange={(e) => setFreqAxisScale(e.target.value)}
                aria-label="Heatmap frequency axis scale"
              >
                {FREQ_AXIS_SCALES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <SwapAxesButton
              active={swapHeatmapAxes}
              onClick={() => setSwapHeatmapAxes((v) => !v)}
              title="Swap heatmap frequency and azimuth axes"
              ariaLabel="Swap heatmap frequency and azimuth axes"
            />
          </div>
        </div>
        <SpatialMapCanvas drawFn={heatmapDrawFn} height={HEATMAP_HEIGHT} theme={theme} />
      </article>

      <div className="spatial-map-grid spatial-map-grid--compare">
        {COMPARE_VIEWS.map((view) => (
          <CompareTile
            key={view.id}
            viewId={view.id}
            title={view.title}
            blurb={view.blurb}
            matrix={matrix}
            unit={metricMeta.yLabel}
            theme={theme}
          />
        ))}
      </div>
    </section>
  );
}
