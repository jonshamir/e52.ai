"use client";
import chroma from "chroma-js";
import { useControls } from "leva";
import { useEffect, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BlurredRect, BlurredRectRef } from "./BlurredRect";
import { Rect, RectRef } from "./Rect";
import styles from "./ThreeCanvas.module.css";

// Define the controls type
type Controls = {
  color: string;
  shadowColor: string;
  radius: number;
  size: { x: number; y: number };
};

export default function ThreeCanvas() {
  const controls = useControls({
    color: { value: "#3d5680", label: "Color" },
    shadowColor: { value: "#38281e", label: "Shadow Color" },
    radius: { value: 0.44, min: 0, max: 1, label: "Radius" },
    size: {
      value: { x: 1, y: 1 },
      x: { min: 0 },
      y: { min: 0 },
      label: "Size",
    },
  });

  // Use state to track if we're in the browser
  const [isBrowser, setIsBrowser] = useState(false);

  // Set isBrowser to true once component mounts (client-side only)
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return (
    <Canvas
      className={styles.ThreeCanvas}
      style={{ position: "fixed", inset: 0 }}
      camera={{ position: [0, 0, 15], zoom: 3.5 }}
      gl={{ sortObjects: false }}
      eventSource={isBrowser ? document.body : undefined}
      eventPrefix="client"
    >
      <color attach="background" args={[controls.color]} />
      <RectGrid controls={controls} />
    </Canvas>
  );
}

function RectGrid({ controls }: { controls: Controls }) {
  const chromaColor = chroma(controls.color);
  const chromaShadowColor = chroma(controls.shadowColor);
  const { camera } = useThree();

  // Use a ref for baseOffset instead of state
  const baseOffsetRef = useRef(0);

  // Create a single ref for the rects and blurred rects
  const rectRefs = useRef<Record<string, React.RefObject<RectRef>>>({});
  const blurredRectRefs = useRef<
    Record<string, React.RefObject<BlurredRectRef>>
  >({});

  // Create a ref to store the rect data
  const rectDataRef = useRef<
    Array<
      Array<{
        offset: number;
        size: { x: number; y: number };
        radius: number;
        pos: { x: number; y: number; z: number };
        id: string;
      }>
    >
  >([]);

  // Initialize rect data
  if (rectDataRef.current.length === 0) {
    rectDataRef.current = Array.from({ length: 12 }, (_, i) => {
      return Array.from({ length: 12 }, (_, j) => {
        return {
          offset: 0,
          size: controls.size,
          radius: controls.radius,
          pos: { x: 10 - i * 1.4, y: 10 - j * 1.4, z: 0 },
          id: `${i}-${j}`,
        };
      });
    });
  }

  useFrame(({ pointer, clock }) => {
    // Convert mouse position to angle (pointer ranges from -1 to 1)
    const angleX = pointer.x * Math.PI * -0.05;
    const angleY = pointer.y * Math.PI * -0.05;

    // Calculate new camera position
    const radius = 15; // Same as initial camera position z
    const x = Math.sin(angleX) * radius;
    const z = Math.cos(angleX) * radius;
    const y = Math.sin(angleY) * radius;

    camera.position.x += (x - camera.position.x) * 0.05;
    camera.position.z += (z - camera.position.z) * 0.05;
    camera.position.y += (y - camera.position.y) * 0.05;

    camera.lookAt(0, 0, 0.5);

    // Update the baseOffset with the elapsed time
    baseOffsetRef.current = clock.getElapsedTime();

    // Update all rects and blurred rects directly through their refs
    rectDataRef.current.forEach((rectDataRow, i) => {
      rectDataRow.forEach((rectData, j) => {
        const { id, pos } = rectData;

        // Calculate new offset based on baseOffset
        const offset = Math.max(
          Math.sin(-i + j + baseOffsetRef.current) * 0.5 + 0.1,
          0
        );

        // Update rect position and color
        const rectRef = rectRefs.current[id];
        if (rectRef?.current) {
          rectRef.current.setSize(controls.size);
          rectRef.current.setRadius(controls.radius);
          rectRef.current.setColor(chromaColor.brighten(offset * 0.5).hex());
          // Update position with the offset
          rectRef.current.setPosition([pos.x, pos.y, pos.z + offset]);
        }

        // Update blurred rect color and blur
        const blurredRectRef = blurredRectRefs.current[id];
        if (blurredRectRef?.current) {
          blurredRectRef.current.setSize(controls.size);
          blurredRectRef.current.setRadius(controls.radius);
          blurredRectRef.current.setBlur(offset * 1.5);
          blurredRectRef.current.setColor(
            chromaShadowColor.mix(chromaColor, offset * 0.5).hex()
          );
          // Update position
          blurredRectRef.current.setPosition([
            pos.x + 0.3 * offset,
            pos.y - 0.4 * offset,
            pos.z,
          ]);
        }
      });
    });
  });

  // Helper function to get or create a ref
  const getRectRef = (id: string) => {
    if (!rectRefs.current[id]) {
      // Create a new ref object
      const newRef = { current: null };
      rectRefs.current[id] = newRef as unknown as React.RefObject<RectRef>;
    }
    return rectRefs.current[id];
  };

  // Helper function to get or create a blurred rect ref
  const getBlurredRectRef = (id: string) => {
    if (!blurredRectRefs.current[id]) {
      // Create a new ref object
      const newRef = { current: null };
      blurredRectRefs.current[id] =
        newRef as unknown as React.RefObject<BlurredRectRef>;
    }
    return blurredRectRefs.current[id];
  };

  return (
    <group rotation={[-0.5, 0.35, 0]}>
      <Rect
        size={{ x: 100, y: 100 }}
        color={chromaColor.hex()}
        position={[0, 0, -0.01]}
      />

      {/* Shadows */}
      {rectDataRef.current.map((rectDataRow) =>
        rectDataRow.map((rectData) => {
          const { offset, size, radius, pos, id } = rectData;
          return (
            <BlurredRect
              key={id}
              size={size}
              radius={radius}
              position={[pos.x, pos.y, pos.z]}
              blur={offset * 1.5}
              ref={getBlurredRectRef(id)}
            />
          );
        })
      )}

      {/* Rects */}
      {rectDataRef.current.map((rectDataRow) =>
        rectDataRow.map((rectData) => {
          const { offset, size, radius, pos, id } = rectData;
          return (
            <Rect
              key={id}
              size={size}
              color={chromaColor.brighten(offset * 0.5).hex()}
              radius={radius}
              position={[pos.x, pos.y, pos.z + offset]}
              ref={getRectRef(id)}
            />
          );
        })
      )}
    </group>
  );
}
