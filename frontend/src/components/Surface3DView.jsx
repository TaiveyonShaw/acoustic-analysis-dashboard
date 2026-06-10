import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getChartColors } from "../canvas/themeColors";

function minMax2d(values2d) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const row of values2d) {
    for (const v of row) {
      if (!Number.isFinite(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  if (!Number.isFinite(lo)) return { lo: 0, hi: 1 };
  if (lo === hi) return { lo: lo - 1, hi: hi + 1 };
  return { lo, hi };
}

function buildSurfaceGeometry(matrix, range) {
  const nAz = matrix.length;
  const nF = matrix[0]?.length ?? 0;
  const positions = new Float32Array(nAz * nF * 3);
  const span = range.hi - range.lo || 1;

  let i = 0;
  for (let ai = 0; ai < nAz; ai++) {
    for (let fi = 0; fi < nF; fi++) {
      positions[i++] = fi / Math.max(1, nF - 1);
      positions[i++] = (matrix[ai][fi] - range.lo) / span;
      positions[i++] = ai / Math.max(1, nAz - 1);
    }
  }

  const indices = [];
  for (let ai = 0; ai < nAz - 1; ai++) {
    for (let fi = 0; fi < nF - 1; fi++) {
      const a = ai * nF + fi;
      const b = a + 1;
      const c = a + nF + 1;
      const d = a + nF;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  });
}

export default function Surface3DView({ matrix, unit, theme, height = 260 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !matrix?.length || !matrix[0]?.length) return;

    const colors = getChartColors();
    const range = minMax2d(matrix);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.bg);

    const width = container.clientWidth || 320;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(9, 6.5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 28;

    const scaleX = 8;
    const scaleY = 3.2;
    const scaleZ = 5.5;

    const geometry = buildSurfaceGeometry(matrix, range);
    const surface = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.accent),
        wireframe: true,
      }),
    );
    surface.scale.set(scaleX, scaleY, scaleZ);
    surface.position.set(scaleX / 2, 0, scaleZ / 2);
    scene.add(surface);

    const baseY = -0.04 * scaleY;
    const baseGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, baseY, 0),
      new THREE.Vector3(scaleX, baseY, 0),
      new THREE.Vector3(scaleX, baseY, scaleZ),
      new THREE.Vector3(0, baseY, scaleZ),
      new THREE.Vector3(0, baseY, 0),
    ]);
    const base = new THREE.Line(
      baseGeo,
      new THREE.LineBasicMaterial({ color: new THREE.Color(colors.label), transparent: true, opacity: 0.55 }),
    );
    scene.add(base);

    controls.target.set(scaleX / 2, scaleY * 0.35, scaleZ / 2);
    controls.update();

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      if (!w) return;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height, false);
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(container);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      controls.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [matrix, unit, theme, height]);

  return (
    <div className="chart-canvas-wrap spatial-map-canvas-wrap surface3d-view-wrap" style={{ minHeight: height }}>
      <div ref={containerRef} className="surface3d-view" style={{ height }} aria-label="Interactive 3D surface" />
      <p className="muted small surface3d-hint">Drag to rotate · scroll to zoom</p>
    </div>
  );
}
