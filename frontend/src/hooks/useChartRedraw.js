import { useEffect, useRef } from "react";

/**
 * Redraw canvas when container resizes, window resizes, or deps change (e.g. theme).
 */
export function useChartRedraw(canvasRef, drawFn, deps) {
  const drawRef = useRef(drawFn);
  drawRef.current = drawFn;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const run = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) drawRef.current();
        });
      });
    };

    run();

    const target = canvas.parentElement ?? canvas;
    const observer = new ResizeObserver(run);
    observer.observe(target);
    window.addEventListener("resize", run);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", run);
    };
  }, deps);
}
