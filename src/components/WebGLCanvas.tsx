"use client";

import { Canvas } from "@react-three/fiber";
import { Circle, OrbitControls } from "@react-three/drei";
import { QUAD_COUNT, LINE_COLOR } from "./canvas/constants";
import Points from "./canvas/Points";
import Lines from "./canvas/Lines";
import TickMarks from "./canvas/TickMarks";
import { LINE_WIDTH } from "./canvas/constants";
import CircleLine from "./canvas/CircleLine";

export default function WebGLCanvas() {
  const positions: [number, number, number][] = Array.from(
    { length: QUAD_COUNT },
    () => [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2]
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 2]}
      gl={{ alpha: true, premultipliedAlpha: true, outputColorSpace: "srgb" }}
      className="effect-canvas"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "all",
      }}
    >
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        makeDefault
      />
      <TickMarks tickCount={60} tickLength={0.15} tickWidth={LINE_WIDTH} />
      <TickMarks tickCount={12} tickLength={2} tickWidth={LINE_WIDTH} />
      <CircleLine center={[0, 0, 0]} radius={2} lineWidth={LINE_WIDTH} />
      {/* <Lines positions={positions} /> */}
      <Points positions={positions} />
    </Canvas>
  );
}
