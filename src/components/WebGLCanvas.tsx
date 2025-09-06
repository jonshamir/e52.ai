"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const QUAD_COUNT = 30; // n quads
// Tweak these two to control quad size and color
const QUAD_RADIUS = 10; // radius in pixels
const QUAD_COLOR = new THREE.Color(0.345, 0.345, 0.345);

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  return res.text();
}

function useFragmentShader() {
  const [frag, setFrag] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    fetchText("/shaders/fragment.glsl").then((text) => {
      if (!mounted) return;
      let sanitized = text
        .split("\n")
        .filter((line) => !line.trim().startsWith("#extension"))
        .join("\n");
      // Inject uniform to control color
      // Replace the final color vec4 with a uniform-driven color keeping alpha
      sanitized = sanitized.replace(
        /vec4\(\s*0\.345\s*,\s*0\.345\s*,\s*0\.345\s*,\s*clamp\(finalAlpha,\s*0\.0,\s*1\.0\)\s*\)/,
        "vec4(u_color, clamp(finalAlpha, 0.0, 1.0))"
      );
      // Prepend uniform declaration if not present
      if (!/uniform\s+vec3\s+u_color\s*;/.test(sanitized)) {
        sanitized = sanitized.replace(
          /precision\s+mediump\s+float\s*;\s*/,
          "precision mediump float;\nuniform vec3 u_color;\n"
        );
      }
      setFrag(sanitized);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return frag;
}

// Vertex shader compatible with the existing fragment shader varyings
const quadVertexShader = /* glsl */ `
attribute vec2 instanceOffset; // per-instance offset in clip space [-1,1]
uniform vec2 u_resolution;     // in pixels
uniform float u_time;
uniform vec2 u_cursorPosition; // normalized device coords (-1..1)
uniform float u_quadRadius;     // configurable radius
varying vec2 v_localPos;
varying float v_distanceFromCenter;

void main() {
  // plane geometry is sized 2x2, so position.xy is in [-1,1]
  v_localPos = position.xy;

  // Convert pixel radius to clip-space radius (NDC): 2px/width and 2px/height
  vec2 quadRadius = vec2(2.0 * u_quadRadius / u_resolution.x, 2.0 * u_quadRadius / u_resolution.y);

  // place quad at per-instance offset
  vec2 worldPos = instanceOffset + position.xy * quadRadius;

  // distance from center for falloff (matches fragment’s use)
  v_distanceFromCenter = length(instanceOffset);

  gl_Position = vec4(worldPos, 0.0, 1.0);
}
`;

function Quads({ count }: { count: number }) {
  const fragmentShader = useFragmentShader();
  const { size } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Random positions in clip space [-1,1]
  const offsets = useMemo(() => {
    const arr = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      arr[i * 2 + 0] = x;
      arr[i * 2 + 1] = y;
    }
    return arr;
  }, [count]);

  // Create per-instance buffer attribute for offsets
  const instanceOffsetAttr = useMemo(() => {
    const buffer = new THREE.InstancedBufferAttribute(offsets, 2);
    return buffer;
  }, [offsets]);

  // Update uniforms
  useFrame(({ clock, pointer }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
      // pointer in NDC (-1..1)
      materialRef.current.uniforms.u_cursorPosition.value.set(pointer.x, pointer.y);
      materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
    }
  });

  // Early-out until fragment shader is loaded
  if (!fragmentShader) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]}>
      {/* Plane 2x2 so vertex positions are in [-1,1] */}
      <planeGeometry args={[2, 2, 1, 1]}>
        {/* Attach per-instance offsets */}
        <instancedBufferAttribute
          attach="attributes-instanceOffset"
          args={[instanceOffsetAttr.array, 2]}
        />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={quadVertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        uniforms={
          {
            u_resolution: { value: new THREE.Vector2(size.width, size.height) },
            u_time: { value: 0 },
            u_cursorPosition: { value: new THREE.Vector2(0, 0) },
            u_quadRadius: { value: QUAD_RADIUS },
            u_color: { value: QUAD_COLOR },
          } as Record<string, any>
        }
      />
    </instancedMesh>
  );
}

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
