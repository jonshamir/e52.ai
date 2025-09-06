"use client";

import { Canvas } from "@react-three/fiber";
import { QUAD_COUNT } from "./canvas/constants";
import Quads from "./canvas/Quads";

export default function WebGLCanvas() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1 }}
      dpr={[1, 2]}
      gl={{ alpha: true, premultipliedAlpha: false }}
      className="effect-canvas"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
    >
      <Quads count={QUAD_COUNT} />
    </Canvas>
  );
}
