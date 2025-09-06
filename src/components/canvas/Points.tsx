"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { POINT_COLOR, POINT_RADIUS } from "./constants";
import { quadVertexShader, quadFragmentShader } from "./shaders";

export default function Points({ positions }: { positions: [number, number, number][] }) {
  const { size } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const offsets = useMemo(() => {
    const arr = new Float32Array(positions.length * 3);
    for (let i = 0; i < positions.length; i++) {
      arr[i * 3 + 0] = positions[i][0];
      arr[i * 3 + 1] = positions[i][1];
      arr[i * 3 + 2] = positions[i][2];
    }
    return arr;
  }, [positions]);

  const instanceOffsetAttr = useMemo(() => {
    const buffer = new THREE.InstancedBufferAttribute(offsets, 3);
    return buffer;
  }, [offsets]);

  const instanceColors = useMemo(() => {
    const colors = new Float32Array(positions.length * 3);
    // Convert to linear space for proper rendering
    const linearColor = POINT_COLOR.clone().convertSRGBToLinear();
    for (let i = 0; i < positions.length; i++) {
      colors[i * 3 + 0] = linearColor.r;
      colors[i * 3 + 1] = linearColor.g;
      colors[i * 3 + 2] = linearColor.b;
    }
    return colors;
  }, [positions.length]);

  const instanceColorAttr = useMemo(() => {
    const buffer = new THREE.InstancedBufferAttribute(instanceColors, 3);
    return buffer;
  }, [instanceColors]);

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

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, positions.length]}>
      <planeGeometry args={[2, 2, 1, 1]}>
        <instancedBufferAttribute attach="attributes-instanceOffset" args={[instanceOffsetAttr.array, 3]} />
        <instancedBufferAttribute attach="attributes-instanceColor" args={[instanceColorAttr.array, 3]} />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={quadVertexShader}
        fragmentShader={quadFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          u_resolution: { value: new THREE.Vector2(size.width, size.height) },
          u_time: { value: 0 },
          u_cursorPosition: { value: new THREE.Vector2(0, 0) },
          u_quadRadius: { value: POINT_RADIUS },
        } as Record<string, any>}
      />
    </instancedMesh>
  );
}


