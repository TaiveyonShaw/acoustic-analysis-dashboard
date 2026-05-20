import { useEffect, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawHeatmap,
  drawAxisLabels,
} from "../canvas/draw";

export default function HeatmapChart({
  title,
  matrix,
  xLabels,
  yLabels,
  xLabel,
  yLabel,
  outlierMask,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !matrix?.length) return;

    const draw = () => {
      const { ctx, width, height } = setupCanvas(canvas, 240);
      const rect = plotRect(width, height);
      drawGrid(ctx, rect, width, height);
      drawHeatmap(ctx, rect, matrix, outlierMask);
      drawAxisLabels(ctx, width, height, xLabel, yLabel);
      void xLabels;
      void yLabels;
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [matrix, outlierMask, xLabel, yLabel, xLabels, yLabels]);

  return (
    <section className="chart-card">
      <h3>{title}</h3>
      <canvas ref={ref} className="chart-canvas" />
    </section>
  );
}
