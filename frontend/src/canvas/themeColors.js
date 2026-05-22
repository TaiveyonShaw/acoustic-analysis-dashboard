/** Read chart colors from CSS variables (theme-aware). */
export function getChartColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name, fallback) => s.getPropertyValue(name).trim() || fallback;
  return {
    bg: v("--chart-bg", "#0f1419"),
    grid: v("--chart-grid", "#1e2a36"),
    label: v("--chart-label", "#8b9cb3"),
    accent: v("--chart-accent", "#5b9bd5"),
    muted: v("--chart-muted", "#8b9cb3"),
    reference: v("--chart-reference", "#d29922"),
    danger: v("--danger", "#e85d56"),
    warn: v("--warn", "#f5a623"),
    series: v("--chart-series", "#72b7b2"),
    spoke: v("--chart-spoke", "#243044"),
    listener: v("--chart-listener", "#5b9bd5"),
    outlierFill: v("--chart-outlier-fill", "rgba(232, 93, 86, 0.22)"),
    outlierStroke: v("--chart-outlier-stroke", "rgba(232, 93, 86, 0.95)"),
    polarGuide: v("--chart-polar-guide", "rgba(255, 255, 255, 0.35)"),
    good: v("--chart-good", "63, 185, 80"),
    bad: v("--chart-bad", "255, 123, 114"),
  };
}
