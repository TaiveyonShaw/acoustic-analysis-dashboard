/** 2D/3D spatial maps: azimuth × frequency × metric value. */

import { freqAxisTitle } from "../utils/freqAxisScale";
import { getChartColors } from "./themeColors";

const SPATIAL_PAD = { top: 16, right: 14, bottom: 36, left: 52 };

export function plotRectSpatialMap(width, height) {
  return {
    x0: SPATIAL_PAD.left,
    y0: SPATIAL_PAD.top,
    w: width - SPATIAL_PAD.left - SPATIAL_PAD.right,
    h: height - SPATIAL_PAD.top - SPATIAL_PAD.bottom,
  };
}

function minMax2d(values2d) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const row of values2d) {
    for (const v of row) {
      if (!Number.isFinite(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  if (!Number.isFinite(lo)) return { lo: 0, hi: 1 };
  if (lo === hi) return { lo: lo - 1, hi: hi + 1 };
  return { lo, hi };
}

function lerpRgb(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function viridis(t) {
  const c0 = [68, 1, 84];
  const c1 = [59, 82, 139];
  const c2 = [33, 145, 140];
  const c3 = [253, 231, 37];
  if (t < 0.33) return lerpRgb(c0, c1, t / 0.33);
  if (t < 0.66) return lerpRgb(c1, c2, (t - 0.33) / 0.33);
  return lerpRgb(c2, c3, (t - 0.66) / 0.34);
}

function valueColor(v, lo, hi) {
  const norm = (v - lo) / (hi - lo || 1);
  const [r, g, b] = viridis(Math.max(0, Math.min(1, norm)));
  return `rgb(${r},${g},${b})`;
}

function formatVal(v) {
  const a = Math.abs(v);
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function formatFreqHz(hz) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)}k`;
  return `${Math.round(hz)}`;
}

function hzToMel(hz) {
  return 2595 * Math.log10(1 + hz / 700);
}

function freqScalePos(hz, scale) {
  if (scale === "linear") return hz;
  if (scale === "log") return Math.log10(hz);
  return hzToMel(hz);
}

/** Normalized edge positions [0..1] for n bins. */
function buildBinEdges(n, scale, values) {
  if (n <= 0) return [0, 1];
  if (scale === "bands" || !values?.length) {
    return Array.from({ length: n + 1 }, (_, i) => i / n);
  }
  const pos = values.map((v) => freqScalePos(v, scale));
  const edges = new Array(n + 1);
  edges[0] = 0;
  edges[n] = 1;
  for (let i = 1; i < n; i++) {
    const lo = pos[i - 1];
    const hi = pos[i];
    const span = pos[n - 1] - pos[0] || 1;
    edges[i] = ((lo + hi) / 2 - pos[0]) / span;
  }
  return edges;
}

function drawSpatialFrame(ctx, rect, width, height, { xLabel, yLabel, title }) {
  const c = getChartColors();
  ctx.strokeStyle = c.label;
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x0, rect.y0, rect.w, rect.h);

  ctx.fillStyle = c.label;
  ctx.font = "11px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(xLabel, rect.x0 + rect.w / 2, height - 22);
  ctx.save();
  ctx.translate(14, rect.y0 + rect.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "middle";
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  if (title) {
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "600 11px 'DM Sans', system-ui, sans-serif";
    ctx.fillText(title, rect.x0, 4);
  }
}

function drawColorBar(ctx, rect, lo, hi, unit) {
  const c = getChartColors();
  const barW = 8;
  const barH = rect.h * 0.55;
  const x = rect.x0 + rect.w + 6;
  const y = rect.y0 + (rect.h - barH) / 2;
  for (let i = 0; i < barH; i++) {
    const t = 1 - i / barH;
    const [r, g, b] = viridis(t);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y + i, barW, 1.5);
  }
  ctx.fillStyle = c.label;
  ctx.font = "9px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(formatVal(hi), x + barW + 4, y);
  ctx.fillText(formatVal(lo), x + barW + 4, y + barH);
  if (unit) {
    ctx.textBaseline = "bottom";
    ctx.fillText(unit, x, y - 4);
  }
}

function axisPos(rect, edges, index, vertical) {
  const t = edges[index];
  if (vertical) {
    return rect.y0 + rect.h - t * rect.h;
  }
  return rect.x0 + t * rect.w;
}

function drawHeatmapTicks(ctx, rect, {
  freqs,
  azimuths,
  freqEdges,
  azEdges,
  freqOnX,
  freqAxisScale,
}) {
  const c = getChartColors();
  ctx.fillStyle = c.label;
  ctx.font = "9px 'DM Sans', system-ui, sans-serif";

  const freqIndices = pickTickIndices(freqs.length, 6);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const fi of freqIndices) {
    const hz = formatFreqHz(freqs[fi]);
    if (freqOnX) {
      const x = (axisPos(rect, freqEdges, fi, false) + axisPos(rect, freqEdges, fi + 1, false)) / 2;
      ctx.fillText(hz, x, rect.y0 + rect.h + 4);
    } else {
      const y = (axisPos(rect, freqEdges, fi, true) + axisPos(rect, freqEdges, fi + 1, true)) / 2;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(hz, rect.x0 - 4, y);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
    }
  }

  const azIndices = pickTickIndices(azimuths.length, azimuths.length <= 11 ? azimuths.length : 6);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const ai of azIndices) {
    const label = `${azimuths[ai]}°`;
    if (freqOnX) {
      const y = (axisPos(rect, azEdges, ai, true) + axisPos(rect, azEdges, ai + 1, true)) / 2;
      ctx.fillText(label, rect.x0 - 4, y);
    } else {
      const x = (axisPos(rect, azEdges, ai, false) + axisPos(rect, azEdges, ai + 1, false)) / 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(label, x, rect.y0 + rect.h + 4);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
    }
  }

  void freqAxisScale;
}

function pickTickIndices(n, maxTicks) {
  if (n <= maxTicks) return Array.from({ length: n }, (_, i) => i);
  const step = Math.ceil(n / maxTicks);
  const indices = [];
  for (let i = 0; i < n; i += step) indices.push(i);
  if (indices[indices.length - 1] !== n - 1) indices.push(n - 1);
  return indices;
}

/**
 * Heatmap with scaled frequency axis and optional axis swap.
 * Default: X = frequency (scaled), Y = azimuth.
 */
export function drawHeatmap(
  ctx,
  rect,
  values2d,
  width,
  height,
  {
    lo,
    hi,
    unit,
    title,
    freqs = [],
    azimuths = [],
    freqAxisScale = "mel",
    swapAxes = false,
  } = {},
) {
  const nAz = values2d.length;
  const nFreq = values2d[0]?.length ?? 0;
  if (!nAz || !nFreq) return;

  const range = lo != null && hi != null ? { lo, hi } : minMax2d(values2d);
  const c = getChartColors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);

  const freqEdges = buildBinEdges(nFreq, freqAxisScale, freqs);
  const azEdges = buildBinEdges(nAz, "bands", azimuths);

  const freqOnX = !swapAxes;

  for (let ai = 0; ai < nAz; ai++) {
    for (let fi = 0; fi < nFreq; fi++) {
      const x0 = freqOnX ? axisPos(rect, freqEdges, fi, false) : axisPos(rect, azEdges, ai, false);
      const x1 = freqOnX
        ? axisPos(rect, freqEdges, fi + 1, false)
        : axisPos(rect, azEdges, ai + 1, false);
      const y1 = freqOnX ? axisPos(rect, azEdges, ai, true) : axisPos(rect, freqEdges, fi, true);
      const y0 = freqOnX
        ? axisPos(rect, azEdges, ai + 1, true)
        : axisPos(rect, freqEdges, fi + 1, true);

      ctx.fillStyle = valueColor(values2d[ai][fi], range.lo, range.hi);
      ctx.fillRect(x0, y0, x1 - x0 + 0.5, y1 - y0 + 0.5);
    }
  }

  const xLabel = freqOnX
    ? freqAxisTitle(freqAxisScale)
    : "Azimuth (°)";
  const yLabel = freqOnX
    ? "Azimuth (°)"
    : freqAxisTitle(freqAxisScale, { vertical: true });

  drawSpatialFrame(ctx, rect, width, height, { xLabel, yLabel, title });
  drawColorBar(ctx, rect, range.lo, range.hi, unit);

  if (freqs.length && azimuths.length) {
    drawHeatmapTicks(ctx, rect, {
      freqs,
      azimuths,
      freqEdges,
      azEdges,
      freqOnX,
      freqAxisScale,
    });
  }

  return range;
}

/** Contour lines over a faint heatmap background (uniform bin grid). */
export function drawContourMap(ctx, rect, values2d, width, height, { lo, hi, unit, title, levels = 7 } = {}) {
  const nY = values2d.length;
  const nX = values2d[0]?.length ?? 0;
  if (!nY || !nX) return;

  const range = lo != null && hi != null ? { lo, hi } : minMax2d(values2d);
  const c = getChartColors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);

  const cellW = rect.w / nX;
  const cellH = rect.h / nY;

  for (let y = 0; y < nY; y++) {
    for (let x = 0; x < nX; x++) {
      const px = rect.x0 + x * cellW;
      const py = rect.y0 + rect.h - (y + 1) * cellH;
      const [r, g, b] = viridis((values2d[y][x] - range.lo) / (range.hi - range.lo || 1));
      ctx.fillStyle = `rgba(${r},${g},${b},0.28)`;
      ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
    }
  }

  const lerpPt = (x0, y0, v0, x1, y1, v1, level) => {
    const t = (level - v0) / (v1 - v0 || 1);
    return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
  };

  ctx.lineWidth = 1.25;
  for (let li = 1; li < levels; li++) {
    const level = range.lo + (li / levels) * (range.hi - range.lo);
    ctx.strokeStyle = li % 2 === 0 ? c.accent : c.label;
    ctx.globalAlpha = 0.75;

    for (let y = 0; y < nY - 1; y++) {
      for (let x = 0; x < nX - 1; x++) {
        const v00 = values2d[y][x];
        const v10 = values2d[y][x + 1];
        const v11 = values2d[y + 1][x + 1];
        const v01 = values2d[y + 1][x];
        const px = rect.x0 + x * cellW;
        const py = rect.y0 + rect.h - (y + 1) * cellH;
        const pts = [];
        const edges = [
          [v00, v10, px, py + cellH / 2, px + cellW, py + cellH / 2],
          [v10, v11, px + cellW, py + cellH / 2, px + cellW, py],
          [v11, v01, px + cellW, py, px, py],
          [v01, v00, px, py, px, py + cellH / 2],
        ];
        for (const [va, vb, x0, y0, x1, y1] of edges) {
          if ((va < level && vb >= level) || (va >= level && vb < level)) {
            pts.push(lerpPt(x0, y0, va, x1, y1, vb, level));
          }
        }
        if (pts.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  drawSpatialFrame(ctx, rect, width, height, {
    xLabel: "Frequency (bin →)",
    yLabel: "Azimuth (row ↑)",
    title,
  });
  drawColorBar(ctx, rect, range.lo, range.hi, unit);
  return range;
}
