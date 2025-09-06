"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LINE_COUNT, LINE_WIDTH, POINT_COLOR } from "./constants";

extend({ Line2, LineMaterial, LineGeometry });

export default function Lines({ positions }: { positions: [number, number][] }) {
  const { size } = useThree();
  const lineRef = useRef<Line2>(null);
  const materialRef = useRef<LineMaterial>(null);

  const connections = useMemo(() => {
    const lines: [number, number][] = [];
    for (let i = 0; i < Math.min(LINE_COUNT, positions.length - 1); i++) {
      const from = Math.floor(Math.random() * positions.length);
      let to = Math.floor(Math.random() * positions.length);
      while (to === from) {
        to = Math.floor(Math.random() * positions.length);
      }
      lines.push([from, to]);
    }
    return lines;
  }, [positions]);

  const points = useMemo(() => {
    const pts: number[] = [];
    const scale = Math.min(size.width, size.height) * 0.5;
    connections.forEach(([from, to]) => {
      const fromPos = positions[from];
      const toPos = positions[to];
      pts.push(fromPos[0] * scale, fromPos[1] * scale, 0);
      pts.push(toPos[0] * scale, toPos[1] * scale, 0);
    });
    return pts;
  }, [connections, positions, size]);

  const geometry = useMemo(() => {
    const geom = new LineGeometry();
    geom.setPositions(points);
    return geom;
  }, [points]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.resolution.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  return (
    <line2 ref={lineRef} geometry={geometry}>
      <lineMaterial
        ref={materialRef}
        color={POINT_COLOR}
        linewidth={LINE_WIDTH}
        resolution={[size.width, size.height]}
      />
    </line2>
  );
}