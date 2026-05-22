import { useCallback, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawHeatmap,
  drawAxisLabels,
} from "../canvas/draw";
import { useChartRedraw } from "../hooks/useChartRedraw";

export default function HeatmapChart({
  title,
  matrix,
  xLabels,
  yLabels,
  xLabel,
  yLabel,
  outlierMask,
  theme,
}) {
  const ref = useRef(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas || !matrix?.length) return;
    const { ctx, width, height } = setupCanvas(canvas, 240);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);
    drawHeatmap(ctx, rect, matrix, outlierMask);
    drawAxisLabels(ctx, width, height, xLabel, yLabel);
    void xLabels;
    void yLabels;
  }, [matrix, outlierMask, xLabel, yLabel, xLabels, yLabels]);

  useChartRedraw(ref, draw, [draw, theme]);

  return (
    <section className="chart-card">
      <h3>{title}</h3>
      <div className="chart-canvas-wrap">
        <canvas ref={ref} className="chart-canvas" />
      </div>
    </section>
  );
}
