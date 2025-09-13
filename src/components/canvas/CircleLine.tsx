"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LINE_COLOR } from "./constants";
import { useCirclesOpacity } from "./useViewDependentOpacity";

extend({ Line2, LineMaterial, LineGeometry });

type CircleLineProps = {
  center?: [number, number, number];
  radius?: number;
  lineWidth?: number; // in pixels
  segments?: number; // number of segments approximating the circle
  color?: THREE.Color | string | number;
};

export default function CircleLine({
  center = [0, 0, 0],
  radius = 1.5,
  lineWidth = 2,
  segments = 128,
  color = LINE_COLOR,
}: CircleLineProps) {
  const { size } = useThree();
  const materialRef = useRef<LineMaterial | null>(null);
  const opacity = useCirclesOpacity();

  const colorLinear = useMemo(() => {
    const c =
      color instanceof THREE.Color
        ? color.clone()
        : new THREE.Color(color as string | number);
    return c.convertSRGBToLinear();
  }, [color]);

  const geometry = useMemo(() => {
    const [cx, cy, cz] = center;
    const clampedSegments = Math.max(3, Math.floor(segments));

    if (radius <= 0) {
      const empty = new LineGeometry();
      empty.setPositions([]);
      return empty;
    }

    const positions: number[] = [];
    for (let i = 0; i <= clampedSegments; i++) {
      const t = (i % clampedSegments) / clampedSegments; // duplicate first point at the end
      const theta = t * Math.PI * 2;
      const x = cx + Math.cos(theta) * radius;
      const y = cy + Math.sin(theta) * radius;
      const z = cz;
      positions.push(x, y, z);
    }

    const geom = new LineGeometry();
    geom.setPositions(positions);
    return geom;
  }, [center, radius, segments]);

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
    <line2 geometry={geometry}>
      {/* @ts-expect-error three-stdlib element */}
      <lineMaterial
        ref={materialRef}
        color={colorLinear}
        linewidth={lineWidth}
        resolution={[size.width, size.height]}
        transparent={true}
        opacity={opacity}
      />
      {/* @ts-expect-error three-stdlib element */}
    </line2>
  );
}
