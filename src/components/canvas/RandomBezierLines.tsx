"use client";

import { useMemo } from "react";
import * as THREE from "three";
import InstancedLines from "./InstancedLines";
import { LINE_COUNT } from "./constants";

export default function RandomBezierLines() {
  const lines = useMemo(() => {
    const lineData = [];
    
    for (let i = 0; i < LINE_COUNT; i++) {
      // Generate random line endpoints
      const startPoint = new THREE.Vector3(
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 400,
        0
      );
      
      const endPoint = new THREE.Vector3(
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 400,
        0
      );
      
      // Random gray color
      const color = new THREE.Color(
        0.2 + Math.random() * 0.3,
        0.2 + Math.random() * 0.3,
        0.2 + Math.random() * 0.3
      );
      
      lineData.push({
        startPoint,
        endPoint,
        color,
      });
    }
    
    return lineData;
  }, []);

  return <InstancedLines lines={lines} segments={20} />;
}