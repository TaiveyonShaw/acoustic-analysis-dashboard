/** Same-origin on Render; override with VITE_API_URL for split deploy (e.g. Netlify UI). */
const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function parseError(res) {
  const text = await res.text();
  try {
    const body = JSON.parse(text);
    if (body.detail) return String(body.detail);
  } catch {
    /* plain text */
  }
  return text || `Request failed (${res.status})`;
}

export async function fetchOsfFolders(signal) {
  const res = await fetch(`${API}/osf/folders`, { signal });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchOsfFiles(folderId, signal) {
  const res = await fetch(`${API}/osf/folders/${encodeURIComponent(folderId)}/files`, {
    signal,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function analyzeOsfFile(osfFile, signal, { recordIndex = 0 } = {}) {
  const form = new FormData();
  form.append("download_url", osfFile.downloadUrl);
  form.append("file_name", osfFile.name);
  form.append("record_index", String(recordIndex));

  const res = await fetch(`${API}/analyze/osf`, {
    method: "POST",
    body: form,
    signal,
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function analyzeFile(file, signal, { recordIndex = 0 } = {}) {
  const form = new FormData();
  form.append("file", file);
  form.append("record_index", String(recordIndex));

  const res = await fetch(`${API}/analyze`, {
    method: "POST",
    body: form,
    signal,
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
