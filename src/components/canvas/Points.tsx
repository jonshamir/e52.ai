"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { POINT_COLOR, POINT_RADIUS } from "./constants";
import { useFragmentShader } from "./useFragmentShader";
import { quadVertexShader } from "./shaders";

export default function Points({ positions }: { positions: [number, number][] }) {
  const fragmentShader = useFragmentShader();
  const { size } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const offsets = useMemo(() => {
    const arr = new Float32Array(positions.length * 2);
    for (let i = 0; i < positions.length; i++) {
      arr[i * 2 + 0] = positions[i][0];
      arr[i * 2 + 1] = positions[i][1];
    }
    return arr;
  }, [positions]);

  const instanceOffsetAttr = useMemo(() => {
    const buffer = new THREE.InstancedBufferAttribute(offsets, 2);
    return buffer;
  }, [offsets]);

  // Update resolution uniform when size changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  useFrame(({ clock, pointer }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
      materialRef.current.uniforms.u_cursorPosition.value.set(pointer.x, pointer.y);
    }
  });

  if (!fragmentShader) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, positions.length]}>
      <planeGeometry args={[2, 2, 1, 1]}>
        <instancedBufferAttribute attach="attributes-instanceOffset" args={[instanceOffsetAttr.array, 2]} />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={quadVertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          u_resolution: { value: new THREE.Vector2(size.width, size.height) },
          u_time: { value: 0 },
          u_cursorPosition: { value: new THREE.Vector2(0, 0) },
          u_quadRadius: { value: POINT_RADIUS },
          u_color: { value: POINT_COLOR },
        } as Record<string, any>}
      />
    </instancedMesh>
  );
}


