import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeFile, analyzeOsfFile } from "./api";
import Sidebar from "./components/Sidebar";
import Metrics from "./components/Metrics";
import ThestructView from "./components/ThestructView";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { theme, toggle: toggleTheme, isLight } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recordIndex, setRecordIndex] = useState(0);

  const fileRef = useRef(null);
  const osfFileRef = useRef(null);
  const abortRef = useRef(null);

  const runAnalysis = useCallback(async (file, idx = 0) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeFile(file, controller.signal, {
        recordIndex: idx,
      });
      setData(result);
      setRecordIndex(result.summary?.selectedIndex ?? idx);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Analysis failed");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const runOsfAnalysis = useCallback(async (osfFile, idx = 0) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeOsfFile(osfFile, controller.signal, {
        recordIndex: idx,
      });
      setData(result);
      setRecordIndex(result.summary?.selectedIndex ?? idx);
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
      osfFileRef.current = null;
      setRecordIndex(0);
      runAnalysis(file, 0);
    },
    [runAnalysis]
  );

  const onOsfFile = useCallback(
    (osfFile) => {
      osfFileRef.current = osfFile;
      fileRef.current = null;
      setRecordIndex(0);
      runOsfAnalysis(osfFile, 0);
    },
    [runOsfAnalysis]
  );

  useEffect(() => {
    if (osfFileRef.current) {
      const timer = setTimeout(() => {
        runOsfAnalysis(osfFileRef.current, recordIndex);
      }, 350);
      return () => clearTimeout(timer);
    }
    if (!fileRef.current) return;
    const timer = setTimeout(() => {
      runAnalysis(fileRef.current, recordIndex);
    }, 350);
    return () => clearTimeout(timer);
  }, [recordIndex, runAnalysis, runOsfAnalysis]);

  const onSelectRecord = useCallback((index) => {
    setRecordIndex(index);
  }, []);

  return (
    <div className="app">
      <Sidebar
        onFile={onFile}
        onOsfFile={onOsfFile}
        loading={loading}
        error={error}
        onToggleTheme={toggleTheme}
        isLight={isLight}
      />

      <main className="main">
        <header className="main-header">
          <h1>Hearing Aid Acoustic Analysis</h1>
          <p>
            ILD/ITD spatial maps from OSF thestruct MAT files — hearing-aid, room, and run
            conditions. Line charts and polar maps.
          </p>
        </header>

        {!data && !loading && (
          <div className="welcome">
            <p>
              Choose a product and subject file from OSF in the sidebar, or upload a local{" "}
              <code>.mat</code> thestruct file.
            </p>
            <ul>
              <li>
                <strong>MAT</strong> — 63 ILD/ITD maps per subject (Occ/Open/Unaid × rooms × runs)
              </li>
              <li>Canvas line charts and polar maps — lightweight, fast rendering</li>
            </ul>
          </div>
        )}

        {(data || loading) && (
          <>
            <Metrics summary={data?.summary} />
            {data && (
              <ThestructView
                data={data}
                theme={theme}
                records={data.records}
                recordIndex={recordIndex}
                onRecordIndex={onSelectRecord}
                loading={loading}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
