/** Fast canvas helpers — no chart libraries. */

import { freqAxisTitle } from "../utils/freqAxisScale";
import { getChartColors } from "./themeColors";

export function setupCanvas(canvas, heightCss) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.maxWidth = "100%";

  const parent = canvas.parentElement;
  let height;
  if (heightCss != null) {
    canvas.style.height = `${heightCss}px`;
    height = heightCss;
  } else {
    canvas.style.height = "100%";
    height = Math.max(
      1,
      Math.floor(parent?.clientHeight || canvas.getBoundingClientRect().height || 280),
    );
  }

  const width = Math.max(
    1,
    Math.floor(canvas.getBoundingClientRect().width || parent?.clientWidth || 1),
  );
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

const PAD = { top: 14, right: 12, bottom: 28, left: 44 };

/** Shared plot area for side-by-side comparison charts (azimuth + frequency). */
export function plotRectComparison(width, height) {
  const left = 52;
  const top = 14;
  const bottom = 40;
  return {
    x0: left,
    y0: top,
    w: width - left - PAD.right,
    h: height - top - bottom,
  };
}

const COMPARISON_GRID = {
  yTicks: 5,
  xTickCount: 5,
  freqXTicks: 9,
  fontSize: 9,
};

/** Frequency on Y: extra left for Hz ticks; optional compact strip layout. */
export function plotRectFrequencyProfile(width, height, { compact = false, detailed = false } = {}) {
  const left = compact ? 22 : detailed ? 72 : 58;
  const top = compact ? 8 : detailed ? 16 : 10;
  const bottom = compact ? 20 : detailed ? 48 : 26;
  return {
    x0: left,
    y0: top,
    w: width - left - PAD.right,
    h: height - top - bottom,
  };
}

function formatFreqHz(hz) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)}k`;
  return `${Math.round(hz)}`;
}

function formatMetricValue(v) {
  const a = Math.abs(v);
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

/** Shared line/marker styling for selected vs unaided comparison charts. */
const COMPARISON_SERIES_STYLE = {
  selected: {
    lineWidth: 1.5,
    dashed: false,
    pointRadius: 4,
    pointHollow: false,
  },
  reference: {
    lineWidth: 1.5,
    dashed: false,
    pointRadius: 4,
    pointHollow: true,
  },
};

/** Linear X by frequency bin index (equal spacing per band, not per Hz). */
function binIndexX(rect, index, nBins, padRatio = 0) {
  const maxI = Math.max(1, nBins - 1);
  const iLo = -padRatio * maxI;
  const iHi = maxI + padRatio * maxI;
  const span = iHi - iLo || 1;
  return rect.x0 + ((index - iLo) / span) * rect.w;
}

/** HTK mel scale (perceptual frequency spacing). */
function hzToMel(hz) {
  return 2595 * Math.log10(1 + hz / 700);
}

function melToHz(mel) {
  return 700 * (10 ** (mel / 2595) - 1);
}

/** Log10 X by frequency in Hz. */
function freqLogX(rect, hz, fMin, fMax, padRatio = 0) {
  const lMin = Math.log10(fMin);
  const lMax = Math.log10(fMax);
  const l = Math.log10(hz);
  const span = lMax - lMin || 1;
  const lo = lMin - padRatio * span;
  const hi = lMax + padRatio * span;
  const s = hi - lo || 1;
  return rect.x0 + ((l - lo) / s) * rect.w;
}

/** Linear X by frequency in Hz. */
function freqHzX(rect, hz, fMin, fMax, padRatio = 0) {
  const span = fMax - fMin || 1;
  const lo = fMin - padRatio * span;
  const hi = fMax + padRatio * span;
  const s = hi - lo || 1;
  return rect.x0 + ((hz - lo) / s) * rect.w;
}

function pickLinearHzTicks(fMin, fMax, tickCount) {
  if (!Number.isFinite(fMin) || !Number.isFinite(fMax)) return [];
  if (fMin === fMax) return [fMin];
  const n = Math.max(2, tickCount);
  return Array.from({ length: n }, (_, i) => fMin + (i * (fMax - fMin)) / (n - 1));
}

/** X position from Hz using linear spacing in mel. */
function freqMelX(rect, hz, fMin, fMax, padRatio = 0) {
  const mMin = hzToMel(fMin);
  const mMax = hzToMel(fMax);
  const mel = hzToMel(hz);
  const span = mMax - mMin || 1;
  const lo = mMin - padRatio * span;
  const hi = mMax + padRatio * span;
  const s = hi - lo || 1;
  return rect.x0 + ((mel - lo) / s) * rect.w;
}

/** Tick positions evenly spaced in mel, labeled in Hz. */
function pickMelHzTicks(fMin, fMax, tickCount) {
  const mMin = hzToMel(fMin);
  const mMax = hzToMel(fMax);
  if (!Number.isFinite(mMin) || !Number.isFinite(mMax)) return [];
  if (mMin === mMax) return [fMin];
  const n = Math.max(2, tickCount);
  return Array.from({ length: n }, (_, i) => melToHz(mMin + (i * (mMax - mMin)) / (n - 1)));
}

function freqScaleX(rect, hz, fMin, fMax, padRatio, scale) {
  if (scale === "linear") return freqHzX(rect, hz, fMin, fMax, padRatio);
  if (scale === "log") return freqLogX(rect, hz, fMin, fMax, padRatio);
  return freqMelX(rect, hz, fMin, fMax, padRatio);
}

function pickFreqScaleTicks(fMin, fMax, tickCount, scale) {
  if (scale === "linear") return pickLinearHzTicks(fMin, fMax, tickCount);
  if (scale === "log") return pickLogHzTicks(fMin, fMax, tickCount);
  return pickMelHzTicks(fMin, fMax, tickCount);
}

function pickLogHzTicks(fMin, fMax, tickCount) {
  if (!Number.isFinite(fMin) || !Number.isFinite(fMax) || fMin <= 0 || fMax <= 0) return [];
  const lMin = Math.log10(fMin);
  const lMax = Math.log10(fMax);
  if (lMin === lMax) return [fMin];
  const n = Math.max(2, tickCount);
  return Array.from({ length: n }, (_, i) => 10 ** (lMin + (i * (lMax - lMin)) / (n - 1)));
}

/** Metric value on Y: lo at bottom, hi at top of plot area. */
function metricValueY(rect, value, vLo, vHi) {
  const vSpan = vHi - vLo || 1;
  return rect.y0 + rect.h - ((value - vLo) / vSpan) * rect.h;
}

/** Metric value on X: lo at left, hi at right. */
function metricValueX(rect, value, vLo, vHi) {
  const vSpan = vHi - vLo || 1;
  return rect.x0 + ((value - vLo) / vSpan) * rect.w;
}

/** Frequency on Y (mel/linear): low at bottom, high at top. */
function freqHzY(rect, hz, fMin, fMax, padRatio = 0) {
  const span = fMax - fMin || 1;
  const lo = fMin - padRatio * span;
  const hi = fMax + padRatio * span;
  const s = hi - lo || 1;
  const t = (hz - lo) / s;
  return rect.y0 + rect.h - t * rect.h;
}

function freqMelY(rect, hz, fMin, fMax, padRatio = 0) {
  const mMin = hzToMel(fMin);
  const mMax = hzToMel(fMax);
  const mel = hzToMel(hz);
  const span = mMax - mMin || 1;
  const lo = mMin - padRatio * span;
  const hi = mMax + padRatio * span;
  const s = hi - lo || 1;
  const t = (mel - lo) / s;
  return rect.y0 + rect.h - t * rect.h;
}

function binIndexY(rect, index, nBins, padRatio = 0) {
  const maxI = Math.max(1, nBins - 1);
  const iLo = -padRatio * maxI;
  const iHi = maxI + padRatio * maxI;
  const span = iHi - iLo || 1;
  const t = (index - iLo) / span;
  return rect.y0 + rect.h - t * rect.h;
}

/** Frequency on Y (log/linear/mel): low at bottom, high at top. */
function freqLogY(rect, hz, fMin, fMax, padRatio = 0) {
  const lMin = Math.log10(fMin);
  const lMax = Math.log10(fMax);
  const l = Math.log10(hz);
  const span = lMax - lMin || 1;
  const lo = lMin - padRatio * span;
  const hi = lMax + padRatio * span;
  const s = hi - lo || 1;
  const t = (l - lo) / s;
  return rect.y0 + rect.h - t * rect.h;
}

function freqScaleY(rect, hz, fMin, fMax, padRatio, scale) {
  if (scale === "linear") return freqHzY(rect, hz, fMin, fMax, padRatio);
  if (scale === "log") return freqLogY(rect, hz, fMin, fMax, padRatio);
  return freqMelY(rect, hz, fMin, fMax, padRatio);
}

function resolveHzScale(freqAxisScale) {
  if (freqAxisScale === "bands") return "mel";
  return freqAxisScale;
}

function valueRangeTight(lo, hi) {
  if (lo === hi) {
    return { vLo: lo - 1, vHi: hi + 1 };
  }
  return { vLo: lo, vHi: hi };
}

function drawProfileLineByBin(
  ctx,
  rect,
  values,
  nBins,
  color,
  vLo,
  vHi,
  binPad,
  { dashed = false, lineWidth = 1.25 } = COMPARISON_SERIES_STYLE.selected,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < nBins; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      started = false;
      continue;
    }
    const x = binIndexX(rect, i, nBins, binPad);
    const y = metricValueY(rect, v, vLo, vHi);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawMarker(ctx, x, y, color, { pointRadius, pointHollow }) {
  ctx.beginPath();
  ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
  if (pointHollow) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawProfileScatterByBin(
  ctx,
  rect,
  values,
  nBins,
  color,
  vLo,
  vHi,
  binPad,
  style = COMPARISON_SERIES_STYLE.selected,
) {
  for (let i = 0; i < nBins; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const x = binIndexX(rect, i, nBins, binPad);
    const y = metricValueY(rect, v, vLo, vHi);
    drawMarker(ctx, x, y, color, style);
  }
}

function drawProfileLineByFreq(
  ctx,
  rect,
  freqs,
  values,
  color,
  vLo,
  vHi,
  fMin,
  fMax,
  fPad,
  freqAxisScale,
  style = COMPARISON_SERIES_STYLE.selected,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = style.lineWidth ?? 1.25;
  if (style.dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < freqs.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || !Number.isFinite(freqs[i])) {
      started = false;
      continue;
    }
    const x = freqScaleX(rect, freqs[i], fMin, fMax, fPad, freqAxisScale);
    const y = metricValueY(rect, v, vLo, vHi);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawProfileScatterByFreq(
  ctx,
  rect,
  freqs,
  values,
  color,
  vLo,
  vHi,
  fMin,
  fMax,
  fPad,
  freqAxisScale,
  style = COMPARISON_SERIES_STYLE.selected,
) {
  for (let i = 0; i < freqs.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || !Number.isFinite(freqs[i])) continue;
    const x = freqScaleX(rect, freqs[i], fMin, fMax, fPad, freqAxisScale);
    const y = metricValueY(rect, v, vLo, vHi);
    drawMarker(ctx, x, y, color, style);
  }
}

function drawProfileLineSwapped(
  ctx,
  rect,
  freqs,
  values,
  color,
  vLo,
  vHi,
  fMin,
  fMax,
  fPad,
  freqAxisScale,
  style = COMPARISON_SERIES_STYLE.selected,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = style.lineWidth ?? 1.25;
  if (style.dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < freqs.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || !Number.isFinite(freqs[i])) {
      started = false;
      continue;
    }
    const x = metricValueX(rect, v, vLo, vHi);
    const y = freqScaleY(rect, freqs[i], fMin, fMax, fPad, resolveHzScale(freqAxisScale));
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawProfileScatterSwapped(
  ctx,
  rect,
  freqs,
  values,
  color,
  vLo,
  vHi,
  fMin,
  fMax,
  fPad,
  freqAxisScale,
  style = COMPARISON_SERIES_STYLE.selected,
) {
  for (let i = 0; i < freqs.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || !Number.isFinite(freqs[i])) continue;
    const x = metricValueX(rect, v, vLo, vHi);
    const y = freqScaleY(rect, freqs[i], fMin, fMax, fPad, resolveHzScale(freqAxisScale));
    drawMarker(ctx, x, y, color, style);
  }
}

function drawProfileLineByBinSwapped(
  ctx,
  rect,
  values,
  nBins,
  color,
  vLo,
  vHi,
  binPad,
  style = COMPARISON_SERIES_STYLE.selected,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = style.lineWidth ?? 1.25;
  if (style.dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < nBins; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      started = false;
      continue;
    }
    const x = metricValueX(rect, v, vLo, vHi);
    const y = binIndexY(rect, i, nBins, binPad);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawProfileScatterByBinSwapped(
  ctx,
  rect,
  values,
  nBins,
  color,
  vLo,
  vHi,
  binPad,
  style = COMPARISON_SERIES_STYLE.selected,
) {
  for (let i = 0; i < nBins; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const x = metricValueX(rect, v, vLo, vHi);
    const y = binIndexY(rect, i, nBins, binPad);
    drawMarker(ctx, x, y, color, style);
  }
}

function drawFrequencyYTicksByBin(
  ctx,
  rect,
  fSorted,
  nBins,
  tickIndices,
  padRatio,
  { labeled = true, fontSize = 9 } = {},
) {
  const c = getChartColors();
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  if (labeled) {
    ctx.fillStyle = c.label;
    ctx.font = `${fontSize}px 'DM Sans', system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
  }

  for (const i of tickIndices) {
    const y = binIndexY(rect, i, nBins, padRatio);
    ctx.beginPath();
    ctx.moveTo(rect.x0, y);
    ctx.lineTo(rect.x0 + rect.w, y);
    ctx.stroke();
    if (labeled && fSorted[i] != null) {
      ctx.fillText(formatFreqHz(fSorted[i]), rect.x0 - 6, y);
    }
  }
}

function drawMetricXTicks(
  ctx,
  rect,
  vLo,
  vHi,
  { n = 5, labeled = true, fontSize = 9 } = {},
) {
  const vSpan = vHi - vLo || 1;
  const c = getChartColors();
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  if (labeled) {
    ctx.fillStyle = c.label;
    ctx.font = `${fontSize}px 'DM Sans', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
  }

  for (let i = 0; i < n; i++) {
    const v = vLo + (vSpan * i) / (n - 1 || 1);
    const x = metricValueX(rect, v, vLo, vHi);
    ctx.beginPath();
    ctx.moveTo(x, rect.y0);
    ctx.lineTo(x, rect.y0 + rect.h);
    ctx.stroke();
    if (labeled) {
      ctx.fillText(formatMetricValue(v), x, rect.y0 + rect.h + 4);
    }
  }
}

function drawFrequencyYTicksByHz(
  ctx,
  rect,
  fMin,
  fMax,
  tickHz,
  padRatio,
  freqAxisScale,
  { labeled = true, fontSize = 9 } = {},
) {
  const c = getChartColors();
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  if (labeled) {
    ctx.fillStyle = c.label;
    ctx.font = `${fontSize}px 'DM Sans', system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
  }

  for (const f of tickHz) {
    const y = freqScaleY(rect, f, fMin, fMax, padRatio, resolveHzScale(freqAxisScale));
    ctx.beginPath();
    ctx.moveTo(rect.x0, y);
    ctx.lineTo(rect.x0 + rect.w, y);
    ctx.stroke();
    if (labeled) {
      ctx.fillText(formatFreqHz(f), rect.x0 - 6, y);
    }
  }
}

function minMax(arr) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { lo: 0, hi: 1 };
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  return { lo, hi };
}

function finiteValues(arr) {
  return (arr ?? []).filter((v) => Number.isFinite(v));
}

function drawLineSeries(
  ctx,
  rect,
  xs,
  ys,
  color,
  tMin,
  tMax,
  yLo,
  yHi,
  { dashed = false, lineWidth = 1.25 } = COMPARISON_SERIES_STYLE.selected,
) {
  const tSpan = tMax - tMin || 1;
  const ySpan = yHi - yLo || 1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < xs.length; i++) {
    const v = ys[i];
    if (!Number.isFinite(v)) {
      started = false;
      continue;
    }
    const x = rect.x0 + ((xs[i] - tMin) / tSpan) * rect.w;
    const y = rect.y0 + rect.h - ((v - yLo) / ySpan) * rect.h;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawScatter(
  ctx,
  rect,
  xs,
  ys,
  color,
  tMin,
  tMax,
  yLo,
  yHi,
  styleOrRadius = COMPARISON_SERIES_STYLE.selected,
) {
  const style =
    typeof styleOrRadius === "number"
      ? { ...COMPARISON_SERIES_STYLE.selected, pointRadius: styleOrRadius }
      : styleOrRadius;
  const tSpan = tMax - tMin || 1;
  const ySpan = yHi - yLo || 1;
  for (let i = 0; i < xs.length; i++) {
    const v = ys[i];
    if (!Number.isFinite(v)) continue;
    const x = rect.x0 + ((xs[i] - tMin) / tSpan) * rect.w;
    const y = rect.y0 + rect.h - ((v - yLo) / ySpan) * rect.h;
    drawMarker(ctx, x, y, color, style);
  }
}

function drawAxisLabels(ctx, width, height, xLabel, yLabel) {
  ctx.fillStyle = getChartColors().label;
  ctx.font = "11px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, width / 2, height - 6);
  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

/** Map display azimuth (0° = front) to canvas radians; front at top. */
function azimuthToCanvasRad(azimuthDeg) {
  return ((azimuthDeg - 90) * Math.PI) / 180;
}

function polarLayout(width, height) {
  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2 - 6;
  const maxR = size * 0.38;
  return {
    size,
    cx,
    cy,
    maxR,
    dotR: Math.max(5, size * 0.022),
    labelOffset: maxR + Math.max(14, size * 0.058),
  };
}

/** Rings, cardinal labels, listener — shared polar backdrop. */
function drawPolarGuides(ctx, width, height, footer = "Listener (top = front)") {
  const c = getChartColors();
  const { size, cx, cy, maxR, dotR, labelOffset } = polarLayout(width, height);

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = c.spoke;
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    const r = (maxR * ring) / 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const labels = ["R", "F", "L", "B"];
  const labelAngles = [90, 0, -90, 180];
  ctx.fillStyle = c.label;
  ctx.font = `${Math.round(Math.max(10, size * 0.034))}px 'DM Sans', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < labels.length; i++) {
    const rad = azimuthToCanvasRad(labelAngles[i]);
    ctx.fillText(
      labels[i],
      cx + Math.cos(rad) * labelOffset,
      cy + Math.sin(rad) * labelOffset,
    );
  }

  ctx.fillStyle = c.listener;
  ctx.beginPath();
  ctx.arc(cx, cy, dotR * 0.55, 0, Math.PI * 2);
  ctx.fill();

  if (footer) {
    ctx.fillStyle = c.label;
    ctx.font = `${Math.round(Math.max(10, size * 0.036))}px 'DM Sans', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(footer, width / 2, height - 10);
  }

  return polarLayout(width, height);
}

/** Polar map: guide spokes per azimuth (no value encoding yet). */
export function drawPolarAccuracy(ctx, width, height, azimuths) {
  if (!azimuths?.length) return;

  const layout = drawPolarGuides(ctx, width, height);
  const { cx, cy, maxR } = layout;
  const c = getChartColors();

  for (const az of azimuths) {
    const rad = azimuthToCanvasRad(az);
    ctx.strokeStyle = c.polarGuide;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * maxR, cy + Math.sin(rad) * maxR);
    ctx.stroke();
  }
}

function sortAzimuthSeries(azimuths, ...series) {
  const order = azimuths
    .map((az, i) => ({ az, i }))
    .sort((a, b) => a.az - b.az)
    .map(({ i }) => i);
  const xs = order.map((i) => azimuths[i]);
  const sorted = series.map((arr) => (arr ? order.map((i) => arr[i]) : null));
  return { xs, sorted };
}

function drawVerticalLineSeries(
  ctx,
  rect,
  azimuths,
  values,
  color,
  azMin,
  azMax,
  vLo,
  vHi,
) {
  const azSpan = azMax - azMin || 1;
  const vSpan = vHi - vLo || 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < azimuths.length; i++) {
    const y = rect.y0 + rect.h - ((azimuths[i] - azMin) / azSpan) * rect.h;
    const x = rect.x0 + ((values[i] - vLo) / vSpan) * rect.w;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function drawVerticalScatter(
  ctx,
  rect,
  azimuths,
  values,
  color,
  azMin,
  azMax,
  vLo,
  vHi,
  radius = 3,
) {
  const azSpan = azMax - azMin || 1;
  const vSpan = vHi - vLo || 1;
  ctx.fillStyle = color;
  for (let i = 0; i < azimuths.length; i++) {
    const y = rect.y0 + rect.h - ((azimuths[i] - azMin) / azSpan) * rect.h;
    const x = rect.x0 + ((values[i] - vLo) / vSpan) * rect.w;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAzimuthXTicks(ctx, rect, azimuths, azMin, azMax, { fontSize = 10 } = {}) {
  const unique = [...new Set(azimuths)].sort((a, b) => a - b);
  const azSpan = azMax - azMin || 1;
  const c = getChartColors();

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = c.label;
  ctx.font = `${fontSize}px 'DM Sans', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (const az of unique) {
    const x = rect.x0 + ((az - azMin) / azSpan) * rect.w;
    ctx.beginPath();
    ctx.moveTo(x, rect.y0);
    ctx.lineTo(x, rect.y0 + rect.h);
    ctx.stroke();
    ctx.fillText(`${az}°`, x, rect.y0 + rect.h + 4);
  }
}

/** Horizontal line plot: azimuth on X, value on Y (optionally vs reference). */
export function drawAzimuthLineChart(
  ctx,
  rect,
  azimuths,
  values,
  width,
  height,
  {
    yLabel = "Value",
    reference = null,
    showPrimary = true,
    comparisonLayout = false,
    swapAxes = false,
  } = {},
) {
  if (!azimuths?.length || !values?.length) return;

  const { xs, sorted } = sortAzimuthSeries(azimuths, values, reference);
  const measured = sorted[0];
  const ref = sorted[1];

  const all = [
    ...(showPrimary ? finiteValues(measured) : []),
    ...(reference ? finiteValues(ref ?? []) : []),
  ];
  if (!all.length) return;
  const { lo, hi } = minMax(all);
  const { vLo, vHi } = comparisonLayout ? valueRangeTight(lo, hi) : (() => {
    const pad = (hi - lo) * 0.1 || 1;
    return { vLo: lo - pad, vHi: hi + pad };
  })();
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);

  const c = getChartColors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);

  const selStyle = COMPARISON_SERIES_STYLE.selected;
  const refStyle = COMPARISON_SERIES_STYLE.reference;
  const tickFontSize = comparisonLayout ? COMPARISON_GRID.fontSize : 10;

  if (swapAxes) {
    drawAzimuthYTicks(ctx, rect, xs, xMin, xMax);
    if (comparisonLayout) {
      drawMetricXTicks(ctx, rect, vLo, vHi, {
        n: COMPARISON_GRID.yTicks,
        labeled: true,
        fontSize: tickFontSize,
      });
    } else {
      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const x = rect.x0 + (rect.w * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, rect.y0);
        ctx.lineTo(x, rect.y0 + rect.h);
        ctx.stroke();
      }
    }
    if (showPrimary) {
      drawVerticalLineSeries(ctx, rect, xs, measured, c.accent, xMin, xMax, vLo, vHi);
      drawVerticalScatter(ctx, rect, xs, measured, c.accent, xMin, xMax, vLo, vHi, selStyle.pointRadius);
    }
    if (reference && ref?.length) {
      drawVerticalLineSeries(ctx, rect, xs, ref, c.reference, xMin, xMax, vLo, vHi);
      drawVerticalScatter(ctx, rect, xs, ref, c.reference, xMin, xMax, vLo, vHi, refStyle.pointRadius);
    }
    if (comparisonLayout) {
      drawComparisonAxisFrame(ctx, rect);
      drawProfileAxisLabels(ctx, width, height, yLabel, "Azimuth (°)");
    } else {
      drawAxisLabels(ctx, width, height, yLabel, "Azimuth (°)");
    }
    return;
  }

  if (comparisonLayout) {
    drawComparisonYGrid(ctx, rect, vLo, vHi);
  } else {
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = rect.y0 + (rect.h * i) / 4;
      ctx.beginPath();
      ctx.moveTo(rect.x0, y);
      ctx.lineTo(rect.x0 + rect.w, y);
      ctx.stroke();
    }
  }

  drawAzimuthXTicks(ctx, rect, xs, xMin, xMax, {
    fontSize: comparisonLayout ? COMPARISON_GRID.fontSize : 10,
  });

  if (showPrimary) {
    drawLineSeries(ctx, rect, xs, measured, c.accent, xMin, xMax, vLo, vHi, selStyle);
    drawScatter(ctx, rect, xs, measured, c.accent, xMin, xMax, vLo, vHi, selStyle);
  }
  if (reference && ref?.length) {
    drawLineSeries(ctx, rect, xs, ref, c.reference, xMin, xMax, vLo, vHi, refStyle);
    drawScatter(ctx, rect, xs, ref, c.reference, xMin, xMax, vLo, vHi, refStyle);
  }

  if (comparisonLayout) {
    drawComparisonAxisFrame(ctx, rect);
    drawProfileAxisLabels(ctx, width, height, "Azimuth (°)", yLabel);
  } else {
    drawAxisLabels(ctx, width, height, "Azimuth (°)", yLabel);
  }
}

function pickFrequencyBinTicks(nBins, detailed) {
  if (nBins <= 0) return [];
  if (!detailed) {
    if (nBins === 1) return [0];
    const mid = Math.floor((nBins - 1) / 2);
    return [0, mid, nBins - 1];
  }
  if (nBins <= 14) return Array.from({ length: nBins }, (_, i) => i);
  const step = 2;
  return Array.from({ length: nBins }, (_, i) => i).filter(
    (i) => i % step === 0 || i === nBins - 1,
  );
}

function drawFrequencyMinorGridByBin(ctx, rect, nBins, labeledIndices, padRatio) {
  const labeled = new Set(labeledIndices ?? []);
  const c = getChartColors();
  ctx.save();
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i < nBins; i++) {
    if (labeled.has(i)) continue;
    const x = binIndexX(rect, i, nBins, padRatio);
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(x, rect.y0);
    ctx.lineTo(x, rect.y0 + rect.h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrequencyXTicksByBin(
  ctx,
  rect,
  fSorted,
  nBins,
  tickIndices,
  padRatio,
  { labeled = true, fontSize = 9 } = {},
) {
  const c = getChartColors();
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  if (labeled) {
    ctx.fillStyle = c.label;
    ctx.font = `${fontSize}px 'DM Sans', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
  }

  for (const i of tickIndices) {
    const x = binIndexX(rect, i, nBins, padRatio);
    ctx.beginPath();
    ctx.moveTo(x, rect.y0);
    ctx.lineTo(x, rect.y0 + rect.h);
    ctx.stroke();
    if (labeled && fSorted[i] != null) {
      ctx.fillText(formatFreqHz(fSorted[i]), x, rect.y0 + rect.h + 4);
    }
  }
}

function drawFrequencyXTicksByHz(
  ctx,
  rect,
  fMin,
  fMax,
  tickHz,
  padRatio,
  freqAxisScale,
  { labeled = true, fontSize = 9 } = {},
) {
  const c = getChartColors();
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  if (labeled) {
    ctx.fillStyle = c.label;
    ctx.font = `${fontSize}px 'DM Sans', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
  }

  for (const f of tickHz) {
    const x = freqScaleX(rect, f, fMin, fMax, padRatio, freqAxisScale);
    ctx.beginPath();
    ctx.moveTo(x, rect.y0);
    ctx.lineTo(x, rect.y0 + rect.h);
    ctx.stroke();
    if (labeled) {
      ctx.fillText(formatFreqHz(f), x, rect.y0 + rect.h + 4);
    }
  }
}

function drawMetricYTicks(
  ctx,
  rect,
  vLo,
  vHi,
  { n = 5, labeled = true, fontSize = 9 } = {},
) {
  const vSpan = vHi - vLo || 1;
  const c = getChartColors();
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  if (labeled) {
    ctx.fillStyle = c.label;
    ctx.font = `${fontSize}px 'DM Sans', system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
  }

  for (let i = 0; i < n; i++) {
    const v = vLo + (vSpan * i) / (n - 1 || 1);
    const y = metricValueY(rect, v, vLo, vHi);
    ctx.beginPath();
    ctx.moveTo(rect.x0, y);
    ctx.lineTo(rect.x0 + rect.w, y);
    ctx.stroke();
    if (labeled) {
      ctx.fillText(formatMetricValue(v), rect.x0 - 6, y);
    }
  }
}

function drawFrequencyAxisFrame(ctx, rect) {
  const c = getChartColors();
  ctx.strokeStyle = c.label;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rect.x0, rect.y0);
  ctx.lineTo(rect.x0, rect.y0 + rect.h);
  ctx.lineTo(rect.x0 + rect.w, rect.y0 + rect.h);
  ctx.stroke();
}

function drawProfileAxisLabels(ctx, width, height, xLabel, yLabel) {
  const c = getChartColors();
  ctx.fillStyle = c.label;
  ctx.font = "11px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(xLabel, width / 2, height - 12);
  ctx.save();
  ctx.translate(14, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function drawComparisonAxisFrame(ctx, rect) {
  drawFrequencyAxisFrame(ctx, rect);
}

function drawComparisonYGrid(ctx, rect, vLo, vHi) {
  drawMetricYTicks(ctx, rect, vLo, vHi, {
    n: COMPARISON_GRID.yTicks,
    labeled: true,
    fontSize: COMPARISON_GRID.fontSize,
  });
}

function pickComparisonBinTicks(nBins, tickCount = COMPARISON_GRID.xTickCount) {
  if (nBins <= 0) return [];
  const n = Math.min(tickCount, nBins);
  if (n === 1) return [0];
  return Array.from({ length: n }, (_, i) => Math.round((i * (nBins - 1)) / (n - 1)));
}

/** One azimuth: frequency on X (mel scale when detailed/comparison), metric on Y. */
export function drawFrequencyProfileChart(
  ctx,
  rect,
  freqs,
  values,
  width,
  height,
  {
    yLabel = "Value",
    showAxisLabels = true,
    reference = null,
    detailed = false,
    showPrimary = true,
    showReference = true,
    comparisonLayout = false,
    freqAxisScale = "mel",
    swapAxes = false,
  } = {},
) {
  if (!freqs?.length) return;

  const hasPrimaryData = values?.length && finiteValues(values).length > 0;
  const hasReferenceData = reference?.length && finiteValues(reference).length > 0;
  if (!hasPrimaryData && !hasReferenceData) return;

  const order = freqs
    .map((f, i) => ({
      f,
      v: values[i],
      r: reference?.[i],
    }))
    .sort((a, b) => a.f - b.f);
  const fSorted = order.map((p) => p.f);
  const vSorted = order.map((p) => p.v);
  const refSorted = reference?.length ? order.map((p) => p.r) : null;

  const c = getChartColors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);

  const nBins = fSorted.length;
  const all = [
    ...(showPrimary ? finiteValues(vSorted) : []),
    ...(showReference && refSorted ? finiteValues(refSorted) : []),
  ];
  if (!all.length) return;
  const { lo, hi } = minMax(all);
  const { vLo, vHi } = valueRangeTight(lo, hi);
  const useComparison = comparisonLayout && showAxisLabels;
  const useBands = freqAxisScale === "bands";
  const hzScale = resolveHzScale(freqAxisScale);
  const useHzPosition = !useBands;
  const fMin = fSorted[0];
  const fMax = fSorted[fSorted.length - 1];
  const fPad = useHzPosition || swapAxes ? 0 : showAxisLabels ? 0.04 : 0.06;
  const binPad = useHzPosition || swapAxes ? 0 : fPad;
  const tickFontSize = useComparison
    ? COMPARISON_GRID.fontSize
    : detailed
      ? 10
      : 9;

  if (swapAxes) {
    if (useBands) {
      const tickIndices = useComparison
        ? pickComparisonBinTicks(nBins, COMPARISON_GRID.xTickCount)
        : pickFrequencyBinTicks(nBins, detailed);
      drawFrequencyYTicksByBin(ctx, rect, fSorted, nBins, tickIndices, binPad, {
        labeled: showAxisLabels,
        fontSize: tickFontSize,
      });
    } else {
      const tickHz = useComparison
        ? pickFreqScaleTicks(fMin, fMax, COMPARISON_GRID.freqXTicks, hzScale)
        : pickFreqScaleTicks(fMin, fMax, Math.min(7, nBins), hzScale);
      drawFrequencyYTicksByHz(ctx, rect, fMin, fMax, tickHz, fPad, hzScale, {
        labeled: showAxisLabels,
        fontSize: tickFontSize,
      });
    }
    if (showAxisLabels) {
      const metricTicks = useComparison ? COMPARISON_GRID.yTicks : detailed ? 7 : 5;
      drawMetricXTicks(ctx, rect, vLo, vHi, {
        n: metricTicks,
        labeled: true,
        fontSize: tickFontSize,
      });
    }
  } else if (useBands) {
    const tickIndices = useComparison
      ? pickComparisonBinTicks(nBins, COMPARISON_GRID.xTickCount)
      : pickFrequencyBinTicks(nBins, detailed);
    if (detailed && !useComparison) {
      drawFrequencyMinorGridByBin(ctx, rect, nBins, tickIndices, binPad);
    }
    drawFrequencyXTicksByBin(ctx, rect, fSorted, nBins, tickIndices, binPad, {
      labeled: showAxisLabels,
      fontSize: tickFontSize,
    });
  } else {
    const tickHz = useComparison
      ? pickFreqScaleTicks(fMin, fMax, COMPARISON_GRID.freqXTicks, hzScale)
      : pickFreqScaleTicks(fMin, fMax, Math.min(7, nBins), hzScale);
    drawFrequencyXTicksByHz(ctx, rect, fMin, fMax, tickHz, fPad, hzScale, {
      labeled: showAxisLabels,
      fontSize: tickFontSize,
    });
  }

  if (showAxisLabels && !swapAxes) {
    if (useComparison) {
      drawComparisonYGrid(ctx, rect, vLo, vHi);
    } else {
      const metricTicks = detailed ? 7 : 5;
      drawMetricYTicks(ctx, rect, vLo, vHi, {
        n: metricTicks,
        labeled: true,
        fontSize: detailed ? 10 : 9,
      });
    }
  }

  if (useComparison) {
    drawComparisonAxisFrame(ctx, rect);
  } else {
    drawFrequencyAxisFrame(ctx, rect);
  }

  const selStyle = COMPARISON_SERIES_STYLE.selected;
  const refStyle = COMPARISON_SERIES_STYLE.reference;

  if (showPrimary) {
    if (swapAxes) {
      if (useBands) {
        drawProfileLineByBinSwapped(ctx, rect, vSorted, nBins, c.accent, vLo, vHi, binPad, selStyle);
        drawProfileScatterByBinSwapped(ctx, rect, vSorted, nBins, c.accent, vLo, vHi, binPad, selStyle);
      } else {
        drawProfileLineSwapped(ctx, rect, fSorted, vSorted, c.accent, vLo, vHi, fMin, fMax, fPad, hzScale, selStyle);
        drawProfileScatterSwapped(ctx, rect, fSorted, vSorted, c.accent, vLo, vHi, fMin, fMax, fPad, hzScale, selStyle);
      }
    } else if (useBands) {
      drawProfileLineByBin(ctx, rect, vSorted, nBins, c.accent, vLo, vHi, binPad, selStyle);
      drawProfileScatterByBin(ctx, rect, vSorted, nBins, c.accent, vLo, vHi, binPad, selStyle);
    } else {
      drawProfileLineByFreq(ctx, rect, fSorted, vSorted, c.accent, vLo, vHi, fMin, fMax, fPad, hzScale, selStyle);
      drawProfileScatterByFreq(ctx, rect, fSorted, vSorted, c.accent, vLo, vHi, fMin, fMax, fPad, hzScale, selStyle);
    }
  }
  if (showReference && refSorted?.length) {
    if (swapAxes) {
      if (useBands) {
        drawProfileLineByBinSwapped(ctx, rect, refSorted, nBins, c.reference, vLo, vHi, binPad, refStyle);
        drawProfileScatterByBinSwapped(ctx, rect, refSorted, nBins, c.reference, vLo, vHi, binPad, refStyle);
      } else {
        drawProfileLineSwapped(ctx, rect, fSorted, refSorted, c.reference, vLo, vHi, fMin, fMax, fPad, hzScale, refStyle);
        drawProfileScatterSwapped(ctx, rect, fSorted, refSorted, c.reference, vLo, vHi, fMin, fMax, fPad, hzScale, refStyle);
      }
    } else if (useBands) {
      drawProfileLineByBin(ctx, rect, refSorted, nBins, c.reference, vLo, vHi, binPad, refStyle);
      drawProfileScatterByBin(ctx, rect, refSorted, nBins, c.reference, vLo, vHi, binPad, refStyle);
    } else {
      drawProfileLineByFreq(ctx, rect, fSorted, refSorted, c.reference, vLo, vHi, fMin, fMax, fPad, hzScale, refStyle);
      drawProfileScatterByFreq(ctx, rect, fSorted, refSorted, c.reference, vLo, vHi, fMin, fMax, fPad, hzScale, refStyle);
    }
  }

  if (showAxisLabels) {
    if (swapAxes) {
      drawProfileAxisLabels(ctx, width, height, yLabel, freqAxisTitle(freqAxisScale, { vertical: true }));
    } else {
      drawProfileAxisLabels(ctx, width, height, freqAxisTitle(freqAxisScale), yLabel);
    }
  }
}

function drawAzimuthYTicks(ctx, rect, azimuths, azMin, azMax) {
  const unique = [...new Set(azimuths)].sort((a, b) => a - b);
  const azSpan = azMax - azMin || 1;
  const c = getChartColors();

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = c.label;
  ctx.font = "10px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (const az of unique) {
    const y = rect.y0 + rect.h - ((az - azMin) / azSpan) * rect.h;
    ctx.beginPath();
    ctx.moveTo(rect.x0, y);
    ctx.lineTo(rect.x0 + rect.w, y);
    ctx.stroke();
    ctx.fillText(`${az}°`, rect.x0 - 6, y);
  }
}
