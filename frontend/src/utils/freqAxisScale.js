export const FREQ_AXIS_SCALES = [
  { id: "bands", label: "Analysis bands" },
  { id: "mel", label: "Mel scale" },
  { id: "log", label: "Log Hz" },
  { id: "linear", label: "Linear Hz" },
];

export function freqAxisTitle(scaleId, { vertical = false } = {}) {
  const orient = vertical ? "vertical" : "horizontal";
  switch (scaleId) {
    case "bands":
      return vertical ? "Frequency (Hz, per band)" : "Frequency (Hz, per band)";
    case "linear":
      return `Frequency (Hz, linear ${orient})`;
    case "log":
      return `Frequency (Hz, log ${orient})`;
    default:
      return vertical ? "Frequency (Hz, mel vertical)" : "Frequency (Hz, mel scale)";
  }
}

export function freqAxisHint(scaleId) {
  switch (scaleId) {
    case "bands":
      return "One tick per analysis band (matches the 28-bin MAT grid)";
    case "linear":
      return "Frequency (Hz) on a linear scale";
    case "log":
      return "Frequency (Hz) on a log10 scale";
    default:
      return "Frequency (Hz) on a mel scale";
  }
}

/** Index of the frequency bin closest to `targetHz` (default 250 Hz). */
export function nearestFreqIndex(freqs, targetHz = 250) {
  if (!freqs?.length) return 0;
  let idx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < freqs.length; i++) {
    const diff = Math.abs(freqs[i] - targetHz);
    if (diff < minDiff) {
      minDiff = diff;
      idx = i;
    }
  }
  return idx;
}
