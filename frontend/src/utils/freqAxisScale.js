export const FREQ_AXIS_SCALES = [
  { id: "mel", label: "Mel scale" },
  { id: "linear", label: "Linear Hz" },
];

export function freqAxisTitle(scaleId) {
  if (scaleId === "linear") return "Frequency (Hz, linear)";
  return "Frequency (Hz, mel scale)";
}

export function freqAxisHint(scaleId) {
  if (scaleId === "linear") {
    return "Frequency (Hz) on a linear horizontal scale";
  }
  return "Frequency (Hz) on a mel scale horizontally";
}
