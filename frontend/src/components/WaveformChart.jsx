import { useEffect, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawOutlierBands,
  drawLineSeries,
  drawAxisLabels,
  minMax,
} from "../canvas/draw";

export default function WaveformChart({ waveform, regions }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !waveform?.t?.length) return;

    const draw = () => {
    const { ctx, width, height } = setupCanvas(canvas, 200);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);

    const tMin = waveform.t[0];
    const tMax = waveform.t[waveform.t.length - 1];
    drawOutlierBands(ctx, rect, regions, tMin, tMax);

    const { lo, hi } = minMax(waveform.y);
    drawLineSeries(ctx, rect, waveform.t, waveform.y, "#5b9bd5", tMin, tMax, lo, hi);
    drawAxisLabels(ctx, width, height, "Time (s)", "Amplitude");
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [waveform, regions]);

  return (
    <section className="chart-card">
      <h3>Waveform</h3>
      <canvas ref={ref} className="chart-canvas" />
    </section>
  );
}
