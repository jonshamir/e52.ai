"use client";

import { Canvas } from "@react-three/fiber";
import { QUAD_COUNT } from "./canvas/constants";
import Points from "./canvas/Points";

export default function WebGLCanvas() {
  const positions: [number, number][] = Array.from({ length: QUAD_COUNT }, () => [
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ]);

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1 }}
      dpr={[1, 2]}
      gl={{ alpha: true, premultipliedAlpha: false }}
      className="effect-canvas"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
    >
      <Points positions={positions} />
    </Canvas>
  );
}
