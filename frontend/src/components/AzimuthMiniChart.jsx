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
  overlayValues,
  visibility = { primary: true, reference: true, overlay: true },
  yLabel,
  showAxisLabels = false,
  showHeading = true,
  detailed = false,
  comparisonLayout = false,
  freqAxisScale = "mel",
  canvasHeight = 160,
  theme,
}) {
  const ref = useRef(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas || !freqs?.length || !values?.length) return;
    const { ctx, width, height } = setupCanvas(canvas, canvasHeight);
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
      overlay: overlayValues,
      detailed: comparisonLayout ? true : detailed,
      comparisonLayout,
      freqAxisScale,
      showPrimary: visibility.primary !== false,
      showReference: visibility.reference !== false,
      showOverlay: visibility.overlay !== false,
    });
  }, [
    freqs,
    values,
    referenceValues,
    overlayValues,
    visibility,
    yLabel,
    showAxisLabels,
    detailed,
    comparisonLayout,
    freqAxisScale,
    canvasHeight,
  ]);

  useChartRedraw(ref, draw, [draw, theme]);

  return (
    <div className="azimuth-mini-chart">
      {showHeading && <h4>{azimuth}°</h4>}
      <div
        className={`chart-canvas-wrap${comparisonLayout ? " comparison-chart-plot" : " azimuth-mini-canvas-wrap"}`}
        style={comparisonLayout ? undefined : { minHeight: canvasHeight }}
      >
        <canvas ref={ref} className="chart-canvas" />
      </div>
    </div>
  );
}
