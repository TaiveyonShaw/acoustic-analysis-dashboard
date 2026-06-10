export function plotLayoutHint({ swapAxes, metricYLabel, freqAxisScale }) {
  if (swapAxes) {
    return `${metricYLabel} on the horizontal axis; ${freqAxisHintShort(freqAxisScale)} on the vertical (low at bottom)`;
  }
  return `${freqAxisHintShort(freqAxisScale)} on the horizontal axis; ${metricYLabel} on the vertical (min at bottom)`;
}

function freqAxisHintShort(scaleId) {
  switch (scaleId) {
    case "bands":
      return "frequency bands";
    case "linear":
      return "frequency (linear Hz)";
    case "log":
      return "frequency (log Hz)";
    default:
      return "frequency (mel)";
  }
}
