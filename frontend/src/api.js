const API = "/api";

export async function analyzeWav(file, settings, signal) {
  const form = new FormData();
  form.append("file", file);
  form.append("frame_length", String(settings.frameLength));
  form.append("hop_length", String(settings.hopLength));
  form.append("method", settings.method);
  form.append("contamination", String(settings.contamination));
  form.append("z_threshold", String(settings.zThreshold));
  form.append("iqr_multiplier", String(settings.iqrMultiplier));

  const res = await fetch(`${API}/analyze`, {
    method: "POST",
    body: form,
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Analysis failed (${res.status})`);
  }
  return res.json();
}

export function rowsToCsv(rows) {
  if (!rows?.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [keys.join(",")];
  for (const row of rows) {
    lines.push(keys.map((k) => escape(row[k])).join(","));
  }
  return lines.join("\n");
}

export function downloadText(filename, text, mime = "text/csv") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
