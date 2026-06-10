/** Read chart colors from CSS variables (theme-aware). */
export function getChartColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name, fallback) => s.getPropertyValue(name).trim() || fallback;
  return {
    bg: v("--chart-bg", "#ffffff"),
    grid: v("--chart-grid", "rgba(0, 0, 0, 0.15)"),
    label: v("--chart-label", "#000000"),
    accent: v("--chart-accent", "#0f62fe"),
    muted: v("--chart-muted", "#7f7f7f"),
    reference: v("--chart-reference", "#ff7f0e"),
    danger: v("--danger", "#d62728"),
    warn: v("--warn", "#ff7f0e"),
    series: v("--chart-series", "#2ca02c"),
    spoke: v("--chart-spoke", "#cccccc"),
    listener: v("--chart-listener", "#0f62fe"),
    outlierFill: v("--chart-outlier-fill", "rgba(232, 93, 86, 0.22)"),
    outlierStroke: v("--chart-outlier-stroke", "rgba(232, 93, 86, 0.95)"),
    polarGuide: v("--chart-polar-guide", "rgba(255, 255, 255, 0.35)"),
    good: v("--chart-good", "63, 185, 80"),
    bad: v("--chart-bad", "255, 123, 114"),
  };
}
