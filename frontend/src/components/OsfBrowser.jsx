import { useCallback, useEffect, useState } from "react";
import { fetchOsfFiles, fetchOsfFolders } from "../api";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OsfBrowser({ onSelect, loading, disabled }) {
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [filesError, setFilesError] = useState(null);
  const [projectUrl, setProjectUrl] = useState("");
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderId, setFolderId] = useState("");
  const [fileId, setFileId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);
    fetchOsfFolders()
      .then((data) => {
        if (cancelled) return;
        setProjectUrl(data.projectUrl ?? "");
        setFolders(data.folders ?? []);
        if (data.folders?.length) {
          setFolderId(data.folders[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) setCatalogError(err.message || "Could not load OSF folders");
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!folderId) {
      setFiles([]);
      setFileId("");
      return;
    }
    let cancelled = false;
    setFilesLoading(true);
    setFilesError(null);
    setFileId("");
    fetchOsfFiles(folderId)
      .then((data) => {
        if (cancelled) return;
        setFiles(data.files ?? []);
      })
      .catch((err) => {
        if (!cancelled) setFilesError(err.message || "Could not load files");
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  const selectedFile = files.find((file) => file.id === fileId);

  const handleAnalyze = useCallback(() => {
    if (!selectedFile) return;
    onSelect?.({
      id: selectedFile.id,
      name: selectedFile.name,
      downloadUrl: selectedFile.downloadUrl,
    });
  }, [onSelect, selectedFile]);

  const busy = disabled || loading || catalogLoading || filesLoading;

  return (
    <fieldset className="fieldset osf-browser">
      <legend>OSF data</legend>
      {projectUrl && (
        <p className="osf-hint">
          Browse{" "}
          <a href={projectUrl} target="_blank" rel="noreferrer">
            Data Science 2022–2023
          </a>{" "}
          on OSF.
        </p>
      )}

      {catalogLoading && <p className="status loading">Loading products…</p>}
      {catalogError && <p className="status error">{catalogError}</p>}

      {!catalogLoading && !catalogError && folders.length > 0 && (
        <>
          <label className="field">
            <span>Product</span>
            <select
              value={folderId}
              disabled={busy}
              onChange={(e) => setFolderId(e.target.value)}
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.label}
                </option>
              ))}
            </select>
          </label>

          {filesLoading && <p className="status loading">Loading MAT files…</p>}
          {filesError && <p className="status error">{filesError}</p>}

          {!filesLoading && !filesError && files.length > 0 && (
            <label className="field">
              <span>Subject file</span>
              <select
                value={fileId}
                disabled={busy}
                onChange={(e) => setFileId(e.target.value)}
              >
                <option value="">Select a file…</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                    {file.size ? ` (${formatBytes(file.size)})` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!filesLoading && !filesError && files.length === 0 && (
            <p className="muted">No MAT files in this folder.</p>
          )}

          <button
            type="button"
            className="btn osf-analyze-btn"
            disabled={busy || !selectedFile}
            onClick={handleAnalyze}
          >
            {loading ? "Analyzing…" : "Analyze from OSF"}
          </button>
        </>
      )}
    </fieldset>
  );
}
