import { useCallback, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawOutlierBands,
  drawSpectrogram,
  drawAxisLabels,
} from "../canvas/draw";
import { useChartRedraw } from "../hooks/useChartRedraw";

export default function SpectrogramChart({ spectrogram, regions, theme }) {
  const ref = useRef(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas || !spectrogram?.db?.length) return;
    const { ctx, width, height } = setupCanvas(canvas, 240);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);
    const times = spectrogram.times;
    const tMin = times[0];
    const tMax = times[times.length - 1];
    drawOutlierBands(ctx, rect, regions, tMin, tMax);
    const freqs = spectrogram.freqs;
    drawSpectrogram(ctx, rect, spectrogram.db, tMin, tMax, freqs[0], freqs[freqs.length - 1]);
    drawAxisLabels(ctx, width, height, "Time (s)", "Frequency (Hz)");
  }, [spectrogram, regions]);

  useChartRedraw(ref, draw, [draw, theme]);

  return (
    <section className="chart-card">
      <h3>Spectrogram</h3>
      <div className="chart-canvas-wrap">
        <canvas ref={ref} className="chart-canvas" />
      </div>
    </section>
  );
}
