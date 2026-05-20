import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeFile, downloadText, rowsToCsv } from "./api";
import Sidebar from "./components/Sidebar";
import Metrics from "./components/Metrics";
import WaveformChart from "./components/WaveformChart";
import SpectrogramChart from "./components/SpectrogramChart";
import AnomalyChart from "./components/AnomalyChart";
import FeatureCharts from "./components/FeatureCharts";
import RegionsTable from "./components/RegionsTable";
import ThestructView from "./components/ThestructView";

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
  const [recordIndex, setRecordIndex] = useState(0);

  const fileRef = useRef(null);
  const abortRef = useRef(null);

  const isThestruct = data?.dataType === "thestruct";

  const runAnalysis = useCallback(async (file, cfg, idx = 0) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeFile(file, cfg, controller.signal, {
        recordIndex: idx,
      });
      setData(result);
      if (result.dataType === "thestruct") {
        setRecordIndex(result.summary?.selectedIndex ?? idx);
      }
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
      setRecordIndex(0);
      runAnalysis(file, settings, 0);
    },
    [runAnalysis, settings]
  );

  useEffect(() => {
    if (!fileRef.current) return;
    const isMat = fileRef.current.name?.toLowerCase().endsWith(".mat");
    const timer = setTimeout(() => {
      runAnalysis(fileRef.current, settings, isMat ? recordIndex : 0);
    }, 350);
    return () => clearTimeout(timer);
  }, [settings, recordIndex, runAnalysis]);

  const onSelectRecord = useCallback((index) => {
    setRecordIndex(index);
  }, []);

  const exportFeatures = () => {
    if (isThestruct) {
      exportThestructMatrix();
      return;
    }
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

  const exportThestructMatrix = () => {
    const { selected, matrices, fileName } = data;
    if (!selected?.freqs?.length || !matrices?.normILD) return;
    const azimuths = selected.azimuths ?? [];
    const rows = [];
    for (let a = 0; a < azimuths.length; a++) {
      for (let f = 0; f < selected.freqs.length; f++) {
        rows.push({
          azimuth_deg: azimuths[a],
          freq_hz: selected.freqs[f],
          norm_ild_db: matrices.normILD[a][f],
          norm_itd_us: matrices.normITD[a][f],
          raw_ild_db: matrices.rawILD[a][f],
          raw_itd_us: matrices.rawITD[a][f],
        });
      }
    }
    const label = selected.label.replace(/\s+/g, "_");
    downloadText(`${fileName}_${label}.csv`, rowsToCsv(rows));
  };

  const exportRegions = () => {
    if (isThestruct) {
      if (!data?.records?.length) return;
      const rows = data.records.map((r) => ({
        index: r.index,
        subject: r.subject,
        aid: r.aid,
        room: r.room,
        cond: r.cond,
        run: r.run,
        anomaly_score: r.anomalyScore,
        is_outlier: r.isOutlier,
      }));
      downloadText(`${data.fileName}_records.csv`, rowsToCsv(rows));
      return;
    }
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
        dataType={data?.dataType}
        thestructRecords={isThestruct ? data?.records : null}
        recordIndex={recordIndex}
        onRecordIndex={onSelectRecord}
      />

      <main className="main">
        <header className="main-header">
          <h1>Hearing Aid Acoustic Analysis</h1>
          <p>
            {isThestruct
              ? "ILD/ITD spatial maps from OSF thestruct MAT files — hearing-aid, room, and run conditions."
              : "Frame-level features and outlier detection for WAV recordings — clicks, dropouts, and processing artifacts."}
          </p>
        </header>

        {!data && !loading && (
          <div className="welcome">
            <p>
              Upload a <code>.mat</code> thestruct file or <code>.wav</code> recording in the
              sidebar.
            </p>
            <ul>
              <li>
                <strong>MAT</strong> — 63 ILD/ITD maps per subject (Occ/Open/Unaid × rooms × runs)
              </li>
              <li>
                <strong>WAV</strong> — frame-level acoustic features and temporal outliers
              </li>
              <li>Canvas heatmaps and charts — lightweight, fast rendering</li>
            </ul>
          </div>
        )}

        {(data || loading) && (
          <>
            <Metrics summary={data?.summary} dataType={data?.dataType} />

            <nav className="tabs" role="tablist">
              {["overview", "features", "export"].map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={tab === id ? "active" : ""}
                  onClick={() => setTab(id)}
                  disabled={id === "features" && isThestruct}
                  title={id === "features" && isThestruct ? "Not available for MAT files" : undefined}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
            </nav>

            {tab === "overview" && data && isThestruct && (
              <ThestructView data={data} onSelectRecord={onSelectRecord} />
            )}

            {tab === "overview" && data && !isThestruct && (
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

            {tab === "features" && data && !isThestruct && (
              <div className="tab-panel">
                <FeatureCharts features={data.features} anomaly={data.anomaly} />
              </div>
            )}

            {tab === "export" && data && (
              <div className="tab-panel export-panel">
                <button type="button" className="btn" onClick={exportFeatures}>
                  {isThestruct ? "Download selected record (CSV)" : "Download frame features (CSV)"}
                </button>
                {(isThestruct ? data.records?.some((r) => r.isOutlier) : data.regions?.length > 0) && (
                  <button type="button" className="btn secondary" onClick={exportRegions}>
                    {isThestruct ? "Download record outlier summary (CSV)" : "Download outlier regions (CSV)"}
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
