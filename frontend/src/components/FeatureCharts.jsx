import { useEffect, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawLineSeries,
  drawScatter,
  drawAxisLabels,
  minMax,
} from "../canvas/draw";

function SingleFeature({ feature, mask, times, scores }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !feature?.values?.length) return;

    const draw = () => {
    const { ctx, width, height } = setupCanvas(canvas, 120);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);

    const tMin = feature.times[0];
    const tMax = feature.times[feature.times.length - 1];
    const { lo, hi } = minMax(feature.values);
    drawLineSeries(ctx, rect, feature.times, feature.values, "#72b7b2", tMin, tMax, lo, hi);

    if (mask?.length) {
      const ox = [];
      const oy = [];
      for (let i = 0; i < mask.length; i++) {
        if (mask[i]) {
          ox.push(times[i]);
          oy.push(feature.values[i]);
        }
      }
      if (ox.length) {
        drawScatter(ctx, rect, ox, oy, "#e85d56", tMin, tMax, lo, hi, 3);
      }
    }
    void scores;
    drawAxisLabels(ctx, width, height, "Time (s)", feature.name);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [feature, mask, times, scores]);

  return (
    <div className="feature-mini">
      <h4>{feature.name}</h4>
      <canvas ref={ref} className="chart-canvas" />
    </div>
  );
}

export default function FeatureCharts({ features, anomaly }) {
  if (!features?.length) return null;
  const mask = anomaly?.mask;
  const times = anomaly?.times;

  return (
    <section className="chart-card feature-grid-wrap">
      <h3>Acoustic features</h3>
      <div className="feature-grid">
        {features.map((f) => (
          <SingleFeature
            key={f.name}
            feature={f}
            mask={mask}
            times={times}
          />
        ))}
      </div>
    </section>
  );
}
