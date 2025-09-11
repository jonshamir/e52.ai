"use client";

import { Canvas } from "@react-three/fiber";
import { Circle, OrbitControls } from "@react-three/drei";
import { QUAD_COUNT, LINE_COLOR } from "./canvas/constants";
import Points from "./canvas/Points";
import Lines from "./canvas/Lines";
import TickMarks from "./canvas/TickMarks";
import { LINE_WIDTH } from "./canvas/constants";
import CircleLine from "./canvas/CircleLine";
import { OrbitalMotionProvider } from "./canvas/OrbitalMotionProvider";

export default function WebGLCanvas() {
  // Generate random positions on concentric circles
  const generateCirclePositions = (
    count: number
  ): [number, number, number][] => {
    const circles = [0.5, 1.0, 1.5, 2.0, 2.5]; // Concentric circle radii
    const positions: [number, number, number][] = [];

    for (let i = 0; i < count; i++) {
      // Randomly select a circle
      const radius = circles[Math.floor(Math.random() * circles.length)];
      // Random angle around the circle
      const angle = Math.random() * Math.PI * 2;
      // Calculate x, y position on the circle
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      let z = Math.random() * 4 - 2; // Random z coordinate
      z = (1.5 * Math.floor(z * 1.5)) / 1.5;
      positions.push([x, y, z]);
    }

    return positions;
  };

  const positions: [number, number, number][] =
    generateCirclePositions(QUAD_COUNT);

  const renderConcentricCircles = (
    center: [number, number, number],
    radii: number[]
  ) => {
    return radii.map((radius, index) => (
      <CircleLine
        key={index}
        center={center}
        radius={radius}
        lineWidth={LINE_WIDTH}
      />
    ));
  };

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 5], zoom: 100 }}
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
      <TickMarks
        radius={2.3}
        tickCount={60}
        tickLength={0.15}
        tickWidth={LINE_WIDTH}
      />
      <TickMarks tickCount={12} tickLength={2} tickWidth={LINE_WIDTH} />
      {/* 5 concentric circles with radii from 0.5 to 2.5 */}
      {renderConcentricCircles([0, 0, 0], [0.5, 1.0, 1.5, 2.0])}
      <OrbitalMotionProvider initialPositions={positions}>
        <Lines />
        <Points />
      </OrbitalMotionProvider>
    </Canvas>
  );
}
