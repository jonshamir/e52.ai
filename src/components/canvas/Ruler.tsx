"use client";

import { useEffect, useMemo, useRef } from "react";
import { extend, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LINE_COLOR } from "./constants";
import { useLinesOpacity } from "./useViewDependentOpacity";

extend({ LineSegments2, LineMaterial, LineSegmentsGeometry });

type RulerProps = {
  start?: [number, number, number];
  end?: [number, number, number];
  tickCount: number;
  tickLength: number;
  tickWidth: number;
  tickSpacing?: number; // optional; if provided, overrides uniform distribution
  tickColor?: THREE.Color | string | number;
  direction?: "horizontal" | "vertical" | "custom"; // direction of the ruler
};

export default function Ruler({
  start = [0, 0, 0],
  end,
  tickCount,
  tickLength,
  tickWidth,
  tickSpacing,
  tickColor = LINE_COLOR,
  direction = "horizontal",
}: RulerProps) {
  const { size } = useThree();
  const materialRef = useRef<LineMaterial | null>(null);
  const opacity = useLinesOpacity();

  const colorLinear = useMemo(() => {
    const color =
      tickColor instanceof THREE.Color
        ? tickColor.clone()
        : new THREE.Color(tickColor as string | number);
    return color.convertSRGBToLinear();
  }, [tickColor]);

  const geometry = useMemo(() => {
    const [sx, sy, sz] = start;
    const positions: number[] = [];

    if (tickCount <= 0 || tickLength <= 0) {
      const geom = new LineSegmentsGeometry();
      geom.setPositions([]);
      return geom;
    }

    // Calculate end point based on direction or provided end
    let [ex, ey, ez] = end || [0, 0, 0];

    if (!end) {
      switch (direction) {
        case "horizontal":
          ex = sx + 4; // Default horizontal length
          ey = sy;
          ez = sz;
          break;
        case "vertical":
          ex = sx;
          ey = sy + 4; // Default vertical length
          ez = sz;
          break;
        case "custom":
          // Use start as both start and end if no end provided
          ex = sx;
          ey = sy;
          ez = sz;
          break;
      }
    }

    // Calculate the direction vector and total length
    const dx = ex - sx;
    const dy = ey - sy;
    const dz = ez - sz;
    const totalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (totalLength <= 0) {
      const geom = new LineSegmentsGeometry();
      geom.setPositions([]);
      return geom;
    }

    // Normalize direction vector
    const ndx = dx / totalLength;
    const ndy = dy / totalLength;
    const ndz = dz / totalLength;

    // Calculate perpendicular vector for tick direction
    // For horizontal rulers, ticks go up/down
    // For vertical rulers, ticks go left/right
    let perpX = 0,
      perpY = 0,
      perpZ = 0;

    if (
      direction === "horizontal" ||
      (Math.abs(dy) < 0.1 && Math.abs(dz) < 0.1)
    ) {
      // Horizontal line - ticks go vertically
      perpY = 1;
    } else if (
      direction === "vertical" ||
      (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1)
    ) {
      // Vertical line - ticks go horizontally
      perpX = 1;
    } else {
      // Custom direction - use cross product to find perpendicular
      const up = [0, 0, 1];
      perpX = ndy * up[2] - ndz * up[1];
      perpY = ndz * up[0] - ndx * up[2];
      perpZ = ndx * up[1] - ndy * up[0];

      // Normalize perpendicular vector
      const perpLength = Math.sqrt(
        perpX * perpX + perpY * perpY + perpZ * perpZ
      );
      if (perpLength > 0) {
        perpX /= perpLength;
        perpY /= perpLength;
        perpZ /= perpLength;
      } else {
        perpY = 1; // fallback
      }
    }

    const spacing =
      tickSpacing && tickSpacing > 0
        ? tickSpacing
        : totalLength / (tickCount - 1);
    const actualTickCount =
      tickSpacing && tickSpacing > 0
        ? Math.floor(totalLength / spacing) + 1
        : tickCount;

    for (let i = 0; i < actualTickCount; i++) {
      const t = i * spacing;

      // Clamp t to not exceed total length
      const clampedT = Math.min(t, totalLength);

      // Position along the ruler line
      const px = sx + ndx * clampedT;
      const py = sy + ndy * clampedT;
      const pz = sz + ndz * clampedT;

      // Tick endpoints (perpendicular to the ruler line)
      const tickHalfLength = tickLength / 2;
      const tickStartX = px - perpX * tickHalfLength;
      const tickStartY = py - perpY * tickHalfLength;
      const tickStartZ = pz - perpZ * tickHalfLength;

      const tickEndX = px + perpX * tickHalfLength;
      const tickEndY = py + perpY * tickHalfLength;
      const tickEndZ = pz + perpZ * tickHalfLength;

      // Each tick is a segment: start -> end
      positions.push(
        tickStartX,
        tickStartY,
        tickStartZ,
        tickEndX,
        tickEndY,
        tickEndZ
      );
    }

    const geom = new LineSegmentsGeometry();
    geom.setPositions(positions);
    return geom;
  }, [start, end, tickCount, tickLength, tickSpacing, direction]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.resolution.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  // Update material opacity when opacity changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.opacity = opacity;
      materialRef.current.transparent = opacity < 1.0;
      materialRef.current.needsUpdate = true;
    }
  }, [opacity]);

  // Cleanup geometry when component unmounts
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  return (
    // @ts-expect-error three-stdlib element
    <lineSegments2 geometry={geometry}>
      {/* @ts-expect-error three-stdlib element */}
      <lineMaterial
        ref={materialRef}
        color={colorLinear}
        linewidth={tickWidth}
        resolution={[size.width, size.height]}
        transparent={true}
        opacity={opacity}
        depthWrite={false}
      />
      {/* @ts-expect-error three-stdlib element */}
    </lineSegments2>
  );
}
