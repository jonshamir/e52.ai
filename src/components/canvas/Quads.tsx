"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { QUAD_COLOR, QUAD_RADIUS } from "./constants";
import { useFragmentShader } from "./useFragmentShader";
import { quadVertexShader } from "./shaders";

export default function Quads({ count }: { count: number }) {
  const fragmentShader = useFragmentShader();
  const { size } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

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

  const instanceOffsetAttr = useMemo(() => {
    const buffer = new THREE.InstancedBufferAttribute(offsets, 2);
    return buffer;
  }, [offsets]);

  useFrame(({ clock, pointer }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
      materialRef.current.uniforms.u_cursorPosition.value.set(pointer.x, pointer.y);
      materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
    }
  });

  if (!fragmentShader) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]}>
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
          u_quadRadius: { value: QUAD_RADIUS },
          u_color: { value: QUAD_COLOR },
        } as Record<string, any>}
      />
    </instancedMesh>
  );
}


