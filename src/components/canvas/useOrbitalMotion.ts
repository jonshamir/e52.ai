"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface OrbitalPoint {
  radius: number;
  angle: number;
  speed: number;
  z: number;
}

export function useOrbitalMotion(initialPositions: [number, number, number][]) {
  const orbitalPointsRef = useRef<OrbitalPoint[]>([]);
  const isInitializedRef = useRef(false);
  const [positions, setPositions] = useState<[number, number, number][]>([]);

  // Initialize orbital parameters for each point only once
  useMemo(() => {
    if (!isInitializedRef.current) {
      orbitalPointsRef.current = initialPositions.map(([x, y, z]) => {
        const radius = Math.sqrt(x * x + y * y);
        const angle = Math.atan2(y, x);
        const speed = (Math.random() - 0.5) * 0.002; // Random speed between -0.01 and 0.01
        return { radius, angle, speed, z };
      });

      // Initialize positions with the initial values
      setPositions(initialPositions.map(([x, y, z]) => [x, y, z]));
      isInitializedRef.current = true;
    }
  }, [initialPositions]);

  // Update positions each frame with optimized calculations
  useFrame(() => {
    const points = orbitalPointsRef.current;

    setPositions((prevPositions) => {
      const newPositions: [number, number, number][] = [];

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        point.angle += point.speed;

        // Use faster trigonometric calculations
        const x = Math.cos(point.angle) * point.radius;
        const y = Math.sin(point.angle) * point.radius;

        newPositions[i] = [x, y, point.z];
      }

      return newPositions;
    });
  });

  // Return current animated positions
  const getCurrentPositions = useCallback(() => {
    return positions;
  }, [positions]);

  return {
    positions,
    getCurrentPositions,
  };
}
