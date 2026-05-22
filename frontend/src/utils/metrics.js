export const VALUE_METRICS = [
  { id: "normILD", label: "ILD (normalized)", yLabel: "ILD (dB)", pair: "rawILD" },
  { id: "rawILD", label: "ILD (raw)", yLabel: "ILD (dB)", pair: "normILD" },
  { id: "normITD", label: "ITD (normalized)", yLabel: "ITD (µs)", pair: "rawITD" },
  { id: "rawITD", label: "ITD (raw)", yLabel: "ITD (µs)", pair: "normITD" },
];

export function getMetricMeta(metricId) {
  return VALUE_METRICS.find((m) => m.id === metricId) ?? VALUE_METRICS[0];
}
