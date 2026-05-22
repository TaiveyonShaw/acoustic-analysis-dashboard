import { useCallback, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawLineSeries,
  drawScatter,
  drawAxisLabels,
  minMax,
} from "../canvas/draw";
import { getChartColors } from "../canvas/themeColors";
import { useChartRedraw } from "../hooks/useChartRedraw";

export default function AnomalyChart({ anomaly, theme }) {
  const ref = useRef(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas || !anomaly?.times?.length) return;
    const { ctx, width, height } = setupCanvas(canvas, 180);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);
    const tMin = anomaly.times[0];
    const tMax = anomaly.times[anomaly.times.length - 1];
    const { lo, hi } = minMax(anomaly.scores);
    const c = getChartColors();
    ctx.fillStyle = c.outlierFill;
    ctx.fillRect(rect.x0, rect.y0, rect.w, rect.h);
    drawLineSeries(ctx, rect, anomaly.times, anomaly.scores, c.danger, tMin, tMax, lo, hi);
    const ox = [];
    const oy = [];
    for (let i = 0; i < anomaly.mask.length; i++) {
      if (anomaly.mask[i]) {
        ox.push(anomaly.times[i]);
        oy.push(anomaly.scores[i]);
      }
    }
    if (ox.length) {
      drawScatter(ctx, rect, ox, oy, c.warn, tMin, tMax, lo, hi, 3.5);
    }
    drawAxisLabels(ctx, width, height, "Time (s)", "Score");
  }, [anomaly]);

  useChartRedraw(ref, draw, [draw, theme]);

  return (
    <section className="chart-card">
      <h3>Anomaly score</h3>
      <div className="chart-canvas-wrap">
        <canvas ref={ref} className="chart-canvas" />
      </div>
    </section>
  );
}
