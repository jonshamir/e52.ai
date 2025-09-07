"use client";

import { useEffect, useMemo, useRef } from "react";
import { extend, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

extend({ LineSegments2, LineMaterial, LineSegmentsGeometry });

type TickMarksProps = {
  center: [number, number, number];
  radius: number;
  tickCount: number;
  tickLength: number;
  tickWidth: number;
  tickSpacingRadians?: number; // optional; if provided, overrides uniform distribution
  tickColor: THREE.Color | string | number;
};

export default function TickMarks({
  center,
  radius,
  tickCount,
  tickLength,
  tickWidth,
  tickSpacingRadians,
  tickColor,
}: TickMarksProps) {
  const { size } = useThree();
  const materialRef = useRef<LineMaterial | null>(null);

  const colorLinear = useMemo(() => {
    const color =
      tickColor instanceof THREE.Color
        ? tickColor.clone()
        : new THREE.Color(tickColor as any);
    return color.convertSRGBToLinear();
  }, [tickColor]);

  const geometry = useMemo(() => {
    const [cx, cy, cz] = center;
    const positions: number[] = [];

    if (tickCount <= 0 || radius <= 0 || tickLength <= 0) {
      const geom = new LineSegmentsGeometry();
      geom.setPositions([]);
      return geom;
    }

    const dTheta =
      tickSpacingRadians && tickSpacingRadians > 0
        ? tickSpacingRadians
        : (Math.PI * 2) / tickCount;
    const totalTicks =
      tickSpacingRadians && tickSpacingRadians > 0
        ? Math.floor((Math.PI * 2) / dTheta)
        : tickCount;

    for (let i = 0; i < totalTicks; i++) {
      const theta = i * dTheta;
      // Outer point on circle
      const ox = cx + Math.cos(theta) * radius;
      const oy = cy + Math.sin(theta) * radius;
      const oz = cz;

      // Inner point towards center by tickLength
      const ix = cx + Math.cos(theta) * (radius - tickLength);
      const iy = cy + Math.sin(theta) * (radius - tickLength);
      const iz = cz;

      // Each tick is a segment: inner -> outer (or vice versa)
      positions.push(ix, iy, iz, ox, oy, oz);
    }

    const geom = new LineSegmentsGeometry();
    geom.setPositions(positions);
    return geom;
  }, [center, radius, tickCount, tickLength, tickSpacingRadians]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.resolution.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  return (
    // @ts-expect-error three-stdlib element
    <lineSegments2 geometry={geometry}>
      {/* @ts-expect-error three-stdlib element */}
      <lineMaterial
        ref={materialRef}
        color={colorLinear}
        linewidth={tickWidth}
        resolution={[size.width, size.height]}
      />
      {/* @ts-expect-error three-stdlib element */}
    </lineSegments2>
  );
}
