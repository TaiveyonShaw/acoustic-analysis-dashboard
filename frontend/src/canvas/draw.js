/** Fast canvas helpers — no chart libraries. */

export function setupCanvas(canvas, heightCss = 220) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const parent = canvas.parentElement;
  const width = parent?.clientWidth || 600;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${heightCss}px`;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(heightCss * dpr);
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height: heightCss };
}

const PAD = { top: 14, right: 12, bottom: 28, left: 44 };

export function plotRect(width, height) {
  return {
    x0: PAD.left,
    y0: PAD.top,
    w: width - PAD.left - PAD.right,
    h: height - PAD.top - PAD.bottom,
  };
}

export function drawGrid(ctx, rect, width, height) {
  ctx.fillStyle = "#0f1419";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#1e2a36";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = rect.y0 + (rect.h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(rect.x0, y);
    ctx.lineTo(rect.x0 + rect.w, y);
    ctx.stroke();
  }
}

export function drawOutlierBands(ctx, rect, regions, tMin, tMax) {
  if (!regions?.length || tMax <= tMin) return;
  const span = tMax - tMin;
  ctx.fillStyle = "rgba(232, 93, 86, 0.22)";
  for (const r of regions) {
    const x0 = rect.x0 + ((r.start_s - tMin) / span) * rect.w;
    const x1 = rect.x0 + ((r.end_s - tMin) / span) * rect.w;
    ctx.fillRect(x0, rect.y0, x1 - x0, rect.h);
  }
}

export function minMax(arr) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  return { lo, hi };
}

export function drawLineSeries(ctx, rect, xs, ys, color, tMin, tMax, yLo, yHi) {
  const tSpan = tMax - tMin || 1;
  const ySpan = yHi - yLo || 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < xs.length; i++) {
    const x = rect.x0 + ((xs[i] - tMin) / tSpan) * rect.w;
    const y = rect.y0 + rect.h - ((ys[i] - yLo) / ySpan) * rect.h;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

export function drawScatter(ctx, rect, xs, ys, color, tMin, tMax, yLo, yHi, radius = 3) {
  const tSpan = tMax - tMin || 1;
  const ySpan = yHi - yLo || 1;
  ctx.fillStyle = color;
  for (let i = 0; i < xs.length; i++) {
    const x = rect.x0 + ((xs[i] - tMin) / tSpan) * rect.w;
    const y = rect.y0 + rect.h - ((ys[i] - yLo) / ySpan) * rect.h;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawAxisLabels(ctx, width, height, xLabel, yLabel) {
  ctx.fillStyle = "#8b9cb3";
  ctx.font = "11px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, width / 2, height - 6);
  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

/** Draw matrix heatmap (rows = y-axis, cols = x-axis). Optional bool mask overlays outliers. */
export function drawHeatmap(ctx, rect, values2d, outlierMask) {
  const nY = values2d.length;
  const nX = values2d[0]?.length ?? 0;
  if (!nY || !nX) return;

  let lo = Infinity;
  let hi = -Infinity;
  for (let y = 0; y < nY; y++) {
    for (let x = 0; x < nX; x++) {
      const v = values2d[y][x];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  const span = hi - lo || 1;
  const cellW = rect.w / nX;
  const cellH = rect.h / nY;

  for (let y = 0; y < nY; y++) {
    for (let x = 0; x < nX; x++) {
      const norm = (values2d[y][x] - lo) / span;
      const [r, g, b] = viridis(norm);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const px = rect.x0 + x * cellW;
      const py = rect.y0 + rect.h - (y + 1) * cellH;
      ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
    }
  }

  if (outlierMask?.length) {
    ctx.strokeStyle = "rgba(232, 93, 86, 0.95)";
    ctx.lineWidth = 1.5;
    for (let y = 0; y < nY; y++) {
      for (let x = 0; x < nX; x++) {
        if (!outlierMask[y]?.[x]) continue;
        const px = rect.x0 + x * cellW;
        const py = rect.y0 + rect.h - (y + 1) * cellH;
        ctx.strokeRect(px + 0.5, py + 0.5, cellW - 1, cellH - 1);
      }
    }
  }
}

/** Draw decimated spectrogram (rows = freq, cols = time). */
export function drawSpectrogram(ctx, rect, db2d, tMin, tMax, fMin, fMax) {
  const nF = db2d.length;
  const nT = db2d[0]?.length ?? 0;
  if (!nF || !nT) return;

  let lo = Infinity;
  let hi = -Infinity;
  for (let f = 0; f < nF; f++) {
    for (let t = 0; t < nT; t++) {
      const v = db2d[f][t];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  const span = hi - lo || 1;
  const cellW = rect.w / nT;
  const cellH = rect.h / nF;

  for (let f = 0; f < nF; f++) {
    for (let t = 0; t < nT; t++) {
      const norm = (db2d[f][t] - lo) / span;
      const [r, g, b] = viridis(norm);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const x = rect.x0 + t * cellW;
      const y = rect.y0 + rect.h - (f + 1) * cellH;
      ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
    }
  }
  void tMin;
  void tMax;
  void fMin;
  void fMax;
}

function viridis(t) {
  const c0 = [68, 1, 84];
  const c1 = [59, 82, 139];
  const c2 = [33, 145, 140];
  const c3 = [253, 231, 37];
  if (t < 0.33) return lerp(c0, c1, t / 0.33);
  if (t < 0.66) return lerp(c1, c2, (t - 0.33) / 0.33);
  return lerp(c2, c3, (t - 0.66) / 0.34);
}

function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
