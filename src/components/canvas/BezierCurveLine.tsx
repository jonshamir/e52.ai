"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LINE_WIDTH } from "./constants";

export default function BezierCurveLine() {
  const { size } = useThree();
  const materialRef = useRef<LineMaterial>(null);
  const lineRef = useRef<Line2>(null);

  const line2Object = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-200, -100, 0),
      new THREE.Vector3(-100, 200, 0),
      new THREE.Vector3(100, -200, 0),
      new THREE.Vector3(200, 100, 0)
    );
    const points = curve.getPoints(100);
    const positions: number[] = [];
    for (const point of points) positions.push(point.x, point.y, point.z);
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    const material = new LineMaterial({
      color: new THREE.Color(0.2, 0.2, 0.2),
      linewidth: LINE_WIDTH,
      transparent: true,
      opacity: 0.8,
    });
    return new Line2(geometry, material);
  }, []);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.resolution.set(size.width, size.height);
    }
  });

  return (
    <primitive
      object={line2Object}
      ref={lineRef}
      onUpdate={(obj: Line2) => {
        if (obj.material instanceof LineMaterial) {
          materialRef.current = obj.material;
          obj.material.resolution.set(size.width, size.height);
        }
      }}
    />
  );
}


