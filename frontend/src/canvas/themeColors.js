/** Read chart colors from CSS variables (theme-aware). */
export function getChartColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name, fallback) => s.getPropertyValue(name).trim() || fallback;
  return {
    bg: v("--chart-bg", "#ffffff"),
    grid: v("--chart-grid", "rgba(0, 0, 0, 0.15)"),
    label: v("--chart-label", "#000000"),
    accent: v("--chart-accent", "#0f62fe"),
    reference: v("--chart-reference", "#ff7f0e"),
    spoke: v("--chart-spoke", "#cccccc"),
    listener: v("--chart-listener", "#0f62fe"),
    polarGuide: v("--chart-polar-guide", "rgba(255, 255, 255, 0.35)"),
  };
}
