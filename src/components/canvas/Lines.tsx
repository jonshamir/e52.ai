"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useThree, extend, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LINE_COUNT, LINE_WIDTH, LINE_COLOR } from "./constants";
import { useLinesOpacity } from "./useViewDependentOpacity";
import { useOrbitalMotion } from "./OrbitalMotionProvider";

extend({ Line2, LineMaterial, LineGeometry });

export default function Lines() {
  const { positions } = useOrbitalMotion();
  const { size } = useThree();
  const materialRefs = useRef<Array<LineMaterial | null>>([]);
  const opacity = useLinesOpacity();

  // State for line animation progress (0 to 1)
  const [lineProgress, setLineProgress] = useState<number[]>([]);
  const animationTimeRef = useRef(0);

  // Memoize connections calculation - only recalculate when positions structure changes
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
    const maxConnections = LINE_COUNT;

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

  // Initialize progress state when connections change
  useEffect(() => {
    const initialProgress = new Array(connections.length).fill(0);
    setLineProgress(initialProgress);
  }, [connections.length]);

  // Animation loop for gradual line drawing
  useFrame((state, delta) => {
    animationTimeRef.current += delta;

    // Update progress every frame for smooth animation
    setLineProgress((prev) => {
      return prev.map((progress, index) => {
        // Each line has its own timing offset based on its index
        const timeOffset = index * 0.3;
        const cycleTime = (state.clock.elapsedTime + timeOffset) % 8; // 8 second cycle

        // Create smooth in/out animation with longer hold time
        if (cycleTime < 0.5) {
          // Drawing in phase (0 to 0.5 seconds) - faster draw
          return cycleTime * 2; // Double speed for quick draw
        } else if (cycleTime < 6.5) {
          // Full line phase (0.5 to 6.5 seconds) - much longer hold
          return 1;
        } else if (cycleTime < 7) {
          // Drawing out phase (6.5 to 7 seconds) - faster fade
          return 1 - (cycleTime - 6.5) * 2; // Double speed for quick fade
        } else {
          // Hidden phase (7 to 8 seconds) - brief pause
          return 0;
        }
      });
    });
  });

  // Build sampled cubic Bezier polylines for each connection with animation progress
  // Calculate polylines dynamically with optimized performance
  const polylines = useMemo(() => {
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
      const progress = lineProgress[i] || 0;

      // Skip lines with zero progress (hidden)
      if (progress <= 0) {
        curves.push(new Float32Array(0));
        continue;
      }

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

      // Calculate how many segments to show based on progress
      const visibleSegments = Math.ceil(SEGMENTS * progress);
      const pts = new Float32Array((visibleSegments + 1) * 3);

      for (let j = 0; j <= visibleSegments; j++) {
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
  }, [connections, positions, lineProgress]);

  // Calculate geometries dynamically for real-time updates
  const geometries = useMemo(() => {
    return polylines.map((pts) => {
      if (pts.length === 0) return null; // Skip empty geometries

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

  // Cleanup geometries when component unmounts
  useEffect(() => {
    return () => {
      geometries.forEach((geom) => {
        if (geom) {
          geom.dispose();
        }
      });
    };
  }, [geometries]);

  return (
    <group>
      {geometries.map((geometry, idx) => {
        // Only render lines with valid geometry
        if (!geometry) return null;

        return (
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
        );
      })}
    </group>
  );
}
