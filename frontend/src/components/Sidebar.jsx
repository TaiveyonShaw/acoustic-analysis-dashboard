import { MoonIcon, SunIcon } from "./ThemeIcon";

const METHOD_LABELS = {
  isolation_forest: "Isolation Forest",
  z_score: "Z-score",
  iqr: "IQR",
};

export default function Sidebar({
  settings,
  onChange,
  onFile,
  loading,
  error,
  dataType,
  thestructRecords,
  recordIndex,
  onRecordIndex,
  onToggleTheme,
  isLight,
}) {
  const set = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Configurations</h2>

      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      >
        <span>{isLight ? "Dark mode" : "Light mode"}</span>
        {isLight ? <MoonIcon /> : <SunIcon />}
      </button>

      <label className="field">
        <span>Audio or MAT file</span>
        <input
          type="file"
          accept=".wav,audio/wav,.mat,application/x-matlab-data"
          disabled={loading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>

      {dataType === "thestruct" && thestructRecords?.length > 0 && (
        <label className="field">
          <span>Record (aid · room · run)</span>
          <select
            value={recordIndex}
            disabled={loading}
            onChange={(e) => onRecordIndex?.(Number(e.target.value))}
          >
            {thestructRecords.map((r) => (
              <option key={r.index} value={r.index}>
                {r.label}
                {r.isOutlier ? " ⚠" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset className="fieldset" disabled={loading}>
        <legend>Outlier detection</legend>
        <label className="field">
          <span>Method</span>
          <select
            value={settings.method}
            onChange={(e) => set("method", e.target.value)}
          >
            {Object.entries(METHOD_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {settings.method === "isolation_forest" && (
          <label className="field">
            <span>Outlier fraction</span>
            <input
              type="range"
              min={0.01}
              max={0.25}
              step={0.01}
              value={settings.contamination}
              onChange={(e) => set("contamination", Number(e.target.value))}
            />
            <output>{settings.contamination.toFixed(2)}</output>
          </label>
        )}

        {settings.method === "z_score" && (
          <label className="field">
            <span>Z threshold</span>
            <input
              type="range"
              min={2}
              max={5}
              step={0.1}
              value={settings.zThreshold}
              onChange={(e) => set("zThreshold", Number(e.target.value))}
            />
            <output>{settings.zThreshold.toFixed(1)}</output>
          </label>
        )}

        {settings.method === "iqr" && (
          <label className="field">
            <span>IQR multiplier</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={settings.iqrMultiplier}
              onChange={(e) => set("iqrMultiplier", Number(e.target.value))}
            />
            <output>{settings.iqrMultiplier.toFixed(1)}</output>
          </label>
        )}
      </fieldset>

      {loading && <p className="status loading">Analyzing…</p>}
      {error && <p className="status error">{error}</p>}
    </aside>
  );
}
