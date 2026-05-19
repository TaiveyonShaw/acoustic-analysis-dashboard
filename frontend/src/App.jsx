import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeWav, downloadText, rowsToCsv } from "./api";
import Sidebar from "./components/Sidebar";
import Metrics from "./components/Metrics";
import WaveformChart from "./components/WaveformChart";
import SpectrogramChart from "./components/SpectrogramChart";
import AnomalyChart from "./components/AnomalyChart";
import FeatureCharts from "./components/FeatureCharts";
import RegionsTable from "./components/RegionsTable";

const DEFAULT_SETTINGS = {
  frameLength: 2048,
  hopLength: 512,
  method: "isolation_forest",
  contamination: 0.05,
  zThreshold: 3,
  iqrMultiplier: 1.5,
};

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  const fileRef = useRef(null);
  const abortRef = useRef(null);

  const runAnalysis = useCallback(async (file, cfg) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeWav(file, cfg, controller.signal);
      setData(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Analysis failed");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const onFile = useCallback(
    (file) => {
      fileRef.current = file;
      runAnalysis(file, settings);
    },
    [runAnalysis, settings]
  );

  useEffect(() => {
    if (!fileRef.current) return;
    const timer = setTimeout(() => {
      runAnalysis(fileRef.current, settings);
    }, 350);
    return () => clearTimeout(timer);
  }, [settings, runAnalysis]);

  const exportFeatures = () => {
    const series = data?.allFeatures ?? data?.features;
    if (!series?.length || !data?.anomaly) return;
    const rows = series[0].times.map((t, i) => {
      const row = { time_s: t, anomaly_score: data.anomaly.scores[i], is_outlier: data.anomaly.mask[i] };
      for (const f of series) {
        row[f.name] = f.values[i];
      }
      return row;
    });
    downloadText(`${data.fileName}_features.csv`, rowsToCsv(rows));
  };

  const exportRegions = () => {
    if (!data?.regions?.length) return;
    const rows = data.regions.map((r) => ({
      start_s: r.start_s,
      end_s: r.end_s,
      duration_s: r.end_s - r.start_s,
      n_frames: r.n_frames,
    }));
    downloadText(`${data.fileName}_outlier_regions.csv`, rowsToCsv(rows));
  };

  return (
    <div className="app">
      <Sidebar
        settings={settings}
        onChange={setSettings}
        onFile={onFile}
        loading={loading}
        error={error}
      />

      <main className="main">
        <header className="main-header">
          <h1>Hearing Aid Acoustic Analysis</h1>
          <p>
            Frame-level features and outlier detection for WAV recordings — clicks,
            dropouts, and processing artifacts.
          </p>
        </header>

        {!data && !loading && (
          <div className="welcome">
            <p>Upload a <code>.wav</code> file in the sidebar to start.</p>
            <ul>
              <li>Canvas rendering — no heavy chart libraries</li>
              <li>Downsampled payloads for fast transfer</li>
              <li>Isolation Forest, Z-score, or IQR detectors</li>
            </ul>
          </div>
        )}

        {(data || loading) && (
          <>
            <Metrics summary={data?.summary} />

            <nav className="tabs" role="tablist">
              {["overview", "features", "export"].map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={tab === id ? "active" : ""}
                  onClick={() => setTab(id)}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
            </nav>

            {tab === "overview" && data && (
              <div className="tab-panel">
                <WaveformChart waveform={data.waveform} regions={data.regions} />
                <div className="chart-row">
                  <SpectrogramChart
                    spectrogram={data.spectrogram}
                    regions={data.regions}
                  />
                  <AnomalyChart anomaly={data.anomaly} />
                </div>
                <section className="chart-card">
                  <h3>Outlier regions</h3>
                  <RegionsTable regions={data.regions} />
                </section>
              </div>
            )}

            {tab === "features" && data && (
              <div className="tab-panel">
                <FeatureCharts features={data.features} anomaly={data.anomaly} />
              </div>
            )}

            {tab === "export" && data && (
              <div className="tab-panel export-panel">
                <button type="button" className="btn" onClick={exportFeatures}>
                  Download frame features (CSV)
                </button>
                {data.regions?.length > 0 && (
                  <button type="button" className="btn secondary" onClick={exportRegions}>
                    Download outlier regions (CSV)
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
