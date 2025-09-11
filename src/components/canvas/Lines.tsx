"use client";

import { useMemo, useRef, useEffect } from "react";
import { useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LINE_COUNT, LINE_WIDTH, LINE_COLOR } from "./constants";
import { useLinesOpacity } from "./useViewDependentOpacity";
import { useOrbitalMotion } from "./useOrbitalMotion";

extend({ Line2, LineMaterial, LineGeometry });

export default function Lines({
  initialPositions,
}: {
  initialPositions: [number, number, number][];
}) {
  const { positions } = useOrbitalMotion(initialPositions);
  const { size } = useThree();
  const materialRefs = useRef<Array<LineMaterial | null>>([]);
  const opacity = useLinesOpacity();

  // Memoize connections calculation - only recalculate when positions change significantly
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
  }, [positions.length]); // Only recalculate when number of positions changes

  // Build sampled cubic Bezier polylines for each connection
  // Calculate polylines dynamically with optimized performance
  const polylines = (() => {
    const curves: Float32Array[] = [];
    const SEGMENTS = 16; // Reduced segments for better performance

    // Optimized cubic Bezier evaluation
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

    for (let i = 0; i < connections.length; i++) {
      const [from, to] = connections[i];
      const p0 = new THREE.Vector3(...positions[from]);
      const p3 = new THREE.Vector3(...positions[to]);

      // Control points with y matching each endpoint and x,z at midpoint
      const c1 = new THREE.Vector3(
        (p0.x + p3.x) * 0.5, // x at midpoint
        p0.y, // y matches first endpoint
        (p0.z + p3.z) * 0.5 // z at midpoint
      );
      const c2 = new THREE.Vector3(
        (p0.x + p3.x) * 0.5, // x at midpoint
        p3.y, // y matches second endpoint
        (p0.z + p3.z) * 0.5 // z at midpoint
      );

      const pts = new Float32Array((SEGMENTS + 1) * 3);
      for (let j = 0; j <= SEGMENTS; j++) {
        const t = j / SEGMENTS;
        const v = cubic(t, p0, c1, c2, p3);
        const idx = j * 3;
        pts[idx] = v.x;
        pts[idx + 1] = v.y;
        pts[idx + 2] = v.z;
      }
      curves.push(pts);
    }

    return curves;
  })();

  // Calculate geometries dynamically for real-time updates
  const geometries = polylines.map((pts) => {
    const geom = new LineGeometry();
    // LineGeometry expects a flat array of xyz positions
    geom.setPositions(Array.from(pts));
    return geom;
  });

  useEffect(() => {
    materialRefs.current.forEach((mat) => {
      if (mat) mat.resolution.set(size.width, size.height);
    });
  }, [size.width, size.height]);

  const lineColor = useMemo(() => {
    // Use dedicated line color with linear space conversion
    return LINE_COLOR.clone().convertSRGBToLinear();
  }, []);

  // Update material opacity when opacity changes
  useEffect(() => {
    materialRefs.current.forEach((mat) => {
      if (mat) {
        mat.opacity = opacity;
        mat.transparent = opacity < 1.0;
        mat.needsUpdate = true;
      }
    });
  }, [opacity]);

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
            transparent={true}
            opacity={opacity}
          />
          {/* @ts-expect-error three-stdlib element */}
        </line2>
      ))}
    </group>
  );
}
