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

export default function AnomalyChart({ anomaly }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !anomaly?.times?.length) return;

    const draw = () => {
    const { ctx, width, height } = setupCanvas(canvas, 180);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);

    const tMin = anomaly.times[0];
    const tMax = anomaly.times[anomaly.times.length - 1];
    const { lo, hi } = minMax(anomaly.scores);

    ctx.fillStyle = "rgba(232, 93, 86, 0.12)";
    ctx.fillRect(rect.x0, rect.y0, rect.w, rect.h);

    drawLineSeries(ctx, rect, anomaly.times, anomaly.scores, "#e85d56", tMin, tMax, lo, hi);

    const ox = [];
    const oy = [];
    for (let i = 0; i < anomaly.mask.length; i++) {
      if (anomaly.mask[i]) {
        ox.push(anomaly.times[i]);
        oy.push(anomaly.scores[i]);
      }
    }
    if (ox.length) {
      drawScatter(ctx, rect, ox, oy, "#f5a623", tMin, tMax, lo, hi, 3.5);
    }
    drawAxisLabels(ctx, width, height, "Time (s)", "Score");
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [anomaly]);

  return (
    <section className="chart-card">
      <h3>Anomaly score</h3>
      <canvas ref={ref} className="chart-canvas" />
    </section>
  );
}
