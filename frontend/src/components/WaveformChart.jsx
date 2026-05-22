import { useCallback, useRef } from "react";
import {
  setupCanvas,
  plotRect,
  drawGrid,
  drawOutlierBands,
  drawLineSeries,
  drawAxisLabels,
  minMax,
} from "../canvas/draw";
import { getChartColors } from "../canvas/themeColors";
import { useChartRedraw } from "../hooks/useChartRedraw";

export default function WaveformChart({ waveform, regions, theme }) {
  const ref = useRef(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas || !waveform?.t?.length) return;
    const { ctx, width, height } = setupCanvas(canvas, 200);
    const rect = plotRect(width, height);
    drawGrid(ctx, rect, width, height);
    const tMin = waveform.t[0];
    const tMax = waveform.t[waveform.t.length - 1];
    drawOutlierBands(ctx, rect, regions, tMin, tMax);
    const { lo, hi } = minMax(waveform.y);
    drawLineSeries(ctx, rect, waveform.t, waveform.y, getChartColors().accent, tMin, tMax, lo, hi);
    drawAxisLabels(ctx, width, height, "Time (s)", "Amplitude");
  }, [waveform, regions]);

  useChartRedraw(ref, draw, [draw, theme]);

  return (
    <section className="chart-card">
      <h3>Waveform</h3>
      <div className="chart-canvas-wrap">
        <canvas ref={ref} className="chart-canvas" />
      </div>
    </section>
  );
}
