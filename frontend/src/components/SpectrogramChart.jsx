import { useEffect, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawOutlierBands,
  drawSpectrogram,
  drawAxisLabels,
} from "../canvas/draw";

export default function SpectrogramChart({ spectrogram, regions }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !spectrogram?.db?.length) return;

    const draw = () => {
    const { ctx, width, height } = setupCanvas(canvas, 240);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);

    const times = spectrogram.times;
    const tMin = times[0];
    const tMax = times[times.length - 1];
    drawOutlierBands(ctx, rect, regions, tMin, tMax);

    const freqs = spectrogram.freqs;
    drawSpectrogram(
      ctx,
      rect,
      spectrogram.db,
      tMin,
      tMax,
      freqs[0],
      freqs[freqs.length - 1]
    );
    drawAxisLabels(ctx, width, height, "Time (s)", "Frequency (Hz)");
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [spectrogram, regions]);

  return (
    <section className="chart-card">
      <h3>Spectrogram</h3>
      <canvas ref={ref} className="chart-canvas" />
    </section>
  );
}
