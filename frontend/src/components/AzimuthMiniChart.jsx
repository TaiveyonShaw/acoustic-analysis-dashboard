import { useCallback, useRef } from "react";
import {
  setupCanvas,
  plotRectComparison,
  plotRectFrequencyProfile,
  drawFrequencyProfileChart,
} from "../canvas/draw";
import { useChartRedraw } from "../hooks/useChartRedraw";

export default function AzimuthMiniChart({
  azimuth,
  freqs,
  values,
  referenceValues,
  visibility = { primary: true, reference: true },
  yLabel,
  showAxisLabels = false,
  showHeading = true,
  detailed = false,
  comparisonLayout = false,
  swapAxes = false,
  freqAxisScale = "mel",
  theme,
}) {
  const ref = useRef(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas || !freqs?.length || !values?.length) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const rect = comparisonLayout
      ? plotRectComparison(width, height)
      : plotRectFrequencyProfile(width, height, {
          compact: !showAxisLabels,
          detailed,
        });
    drawFrequencyProfileChart(ctx, rect, freqs, values, width, height, {
      yLabel,
      showAxisLabels,
      reference: referenceValues,
      detailed: comparisonLayout ? true : detailed,
      comparisonLayout,
      swapAxes,
      freqAxisScale,
      showPrimary: visibility.primary !== false,
      showReference: visibility.reference !== false,
    });
  }, [
    freqs,
    values,
    referenceValues,
    visibility,
    yLabel,
    showAxisLabels,
    detailed,
    comparisonLayout,
    swapAxes,
    freqAxisScale,
  ]);

  useChartRedraw(ref, draw, [draw, theme]);

  return (
    <div className="azimuth-mini-chart">
      {showHeading && <h4>{azimuth}°</h4>}
      <div
        className={`chart-canvas-wrap${comparisonLayout ? " comparison-chart-plot" : " azimuth-mini-canvas-wrap"}`}
      >
        <canvas ref={ref} className="chart-canvas" />
      </div>
    </div>
  );
}
