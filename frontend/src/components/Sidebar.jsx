import { useCallback, useState } from "react";
import { MoonIcon, SunIcon } from "./ThemeIcon";
import OsfBrowser from "./OsfBrowser";

function ChevronIcon({ direction = "left" }) {
  const path = direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg
      className="sidebar-toggle-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

function readCollapsedPreference() {
  try {
    return localStorage.getItem("sidebarCollapsed") === "1";
  } catch {
    return false;
  }
}

export default function Sidebar({
  onFile,
  onOsfFile,
  loading,
  error,
  onToggleTheme,
  isLight,
}) {
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
      aria-label="Configuration sidebar"
    >
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">Configurations</h2>}
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon direction={collapsed ? "right" : "left"} />
        </button>
      </div>

      <div className="sidebar-content" hidden={collapsed}>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span>{isLight ? "Dark mode" : "Light mode"}</span>
          {isLight ? <MoonIcon /> : <SunIcon />}
        </button>

        <OsfBrowser onSelect={onOsfFile} loading={loading} disabled={loading} />

        <p className="source-divider">or upload locally</p>

        <label className="field">
          <span>MAT file</span>
          <input
            type="file"
            accept=".mat,application/x-matlab-data"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>

        {loading && <p className="status loading">Analyzing…</p>}
        {error && <p className="status error">{error}</p>}
      </div>
    </aside>
  );
}
