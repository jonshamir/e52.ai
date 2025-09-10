"use client";

import { useMemo, useRef, useEffect } from "react";
import { useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LINE_COUNT, LINE_WIDTH, LINE_COLOR } from "./constants";

extend({ Line2, LineMaterial, LineGeometry });

export default function Lines({
  positions,
}: {
  positions: [number, number, number][];
}) {
  const { size } = useThree();
  const materialRefs = useRef<Array<LineMaterial | null>>([]);

  const connections = useMemo(() => {
    const lines: [number, number][] = [];

    // Group positions by z-coordinate (layer)
    const layers: { [z: number]: number[] } = {};
    positions.forEach((pos, index) => {
      const z = pos[2];
      if (!layers[z]) {
        layers[z] = [];
      }
      layers[z].push(index);
    });

    // Get sorted z values (layers)
    const sortedZValues = Object.keys(layers)
      .map(Number)
      .sort((a, b) => a - b);

    // Generate connections only between neighboring layers
    let connectionCount = 0;
    const maxConnections = Math.min(LINE_COUNT, positions.length - 1);

    for (
      let i = 0;
      i < sortedZValues.length - 1 && connectionCount < maxConnections;
      i++
    ) {
      const currentLayer = layers[sortedZValues[i]];
      const nextLayer = layers[sortedZValues[i + 1]];

      // Create connections between current and next layer
      const connectionsBetweenLayers = Math.min(
        Math.floor(maxConnections / (sortedZValues.length - 1)),
        currentLayer.length * nextLayer.length
      );

      for (
        let j = 0;
        j < connectionsBetweenLayers && connectionCount < maxConnections;
        j++
      ) {
        const from =
          currentLayer[Math.floor(Math.random() * currentLayer.length)];
        const to = nextLayer[Math.floor(Math.random() * nextLayer.length)];
        lines.push([from, to]);
        connectionCount++;
      }
    }

    return lines;
  }, [positions]);

  // Build sampled cubic Bezier polylines for each connection
  const polylines = useMemo(() => {
    const curves: Float32Array[] = [];
    const SEGMENTS = 24; // segments per curve

    // Helper to evaluate cubic Bezier at t
    const cubic = (
      t: number,
      p0: THREE.Vector3,
      c1: THREE.Vector3,
      c2: THREE.Vector3,
      p3: THREE.Vector3
    ): THREE.Vector3 => {
      const it = 1 - t;
      const it2 = it * it;
      const t2 = t * t;
      const a = it2 * it; // (1-t)^3
      const b = 3 * it2 * t; // 3(1-t)^2 t
      const c = 3 * it * t2; // 3(1-t) t^2
      const d = t * t2; // t^3
      return new THREE.Vector3(
        a * p0.x + b * c1.x + c * c2.x + d * p3.x,
        a * p0.y + b * c1.y + c * c2.y + d * p3.y,
        a * p0.z + b * c1.z + c * c2.z + d * p3.z
      );
    };

    connections.forEach(([from, to]) => {
      const p0 = new THREE.Vector3(...positions[from]);
      const p3 = new THREE.Vector3(...positions[to]);

      // Control points on xy plane (z=0) with y matching adjacent endpoint
      const c1 = new THREE.Vector3(
        THREE.MathUtils.lerp(p0.x, p3.x, 1 / 3),
        p0.y,
        0
      );
      const c2 = new THREE.Vector3(
        THREE.MathUtils.lerp(p0.x, p3.x, 2 / 3),
        p3.y,
        0
      );

      const pts = new Float32Array((SEGMENTS + 1) * 3);
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const v = cubic(t, p0, c1, c2, p3);
        pts[i * 3 + 0] = v.x;
        pts[i * 3 + 1] = v.y;
        pts[i * 3 + 2] = v.z;
      }
      curves.push(pts);
    });

    return curves;
  }, [connections, positions]);

  const geometries = useMemo(() => {
    return polylines.map((pts) => {
      const geom = new LineGeometry();
      // LineGeometry expects a flat array of xyz positions
      geom.setPositions(Array.from(pts));
      return geom;
    });
  }, [polylines]);

  useEffect(() => {
    materialRefs.current.forEach((mat) => {
      if (mat) mat.resolution.set(size.width, size.height);
    });
  }, [size.width, size.height]);

  const lineColor = useMemo(() => {
    // Use dedicated line color with linear space conversion
    return LINE_COLOR.clone().convertSRGBToLinear();
  }, []);

  return (
    <group>
      {geometries.map((geometry, idx) => (
        // @ts-expect-error three-stdlib element
        <line2 key={idx} geometry={geometry}>
          {/* @ts-expect-error three-stdlib element */}
          <lineMaterial
            ref={(ref: LineMaterial | null) =>
              (materialRefs.current[idx] = ref)
            }
            color={lineColor}
            linewidth={LINE_WIDTH}
            resolution={[size.width, size.height]}
          />
          {/* @ts-expect-error three-stdlib element */}
        </line2>
      ))}
    </group>
  );
}
