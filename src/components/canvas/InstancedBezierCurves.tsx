"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BEZIER_COLOR, BEZIER_RADIUS, BEZIER_COUNT } from "./constants";
import { useBezierFragmentShader } from "./useBezierFragmentShader";
import { bezierVertexShader } from "./shaders";

export default function InstancedBezierCurves({ count = BEZIER_COUNT }: { count?: number }) {
  const fragmentShader = useBezierFragmentShader();
  const { size } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Generate random bezier curve control points
  const bezierData = useMemo(() => {
    const p0Array = new Float32Array(count * 2); // start points
    const p1Array = new Float32Array(count * 2); // control point 1
    const p2Array = new Float32Array(count * 2); // control point 2  
    const p3Array = new Float32Array(count * 2); // end points
    
    for (let i = 0; i < count; i++) {
      // Start point
      const startX = (Math.random() - 0.5) * 2;
      const startY = (Math.random() - 0.5) * 2;
      p0Array[i * 2 + 0] = startX;
      p0Array[i * 2 + 1] = startY;
      
      // End point
      const endX = (Math.random() - 0.5) * 2;
      const endY = (Math.random() - 0.5) * 2;
      p3Array[i * 2 + 0] = endX;
      p3Array[i * 2 + 1] = endY;
      
      // Control points
      p1Array[i * 2 + 0] = startX + (Math.random() - 0.5) * 1.0;
      p1Array[i * 2 + 1] = startY + (Math.random() - 0.5) * 1.0;
      p2Array[i * 2 + 0] = endX + (Math.random() - 0.5) * 1.0;
      p2Array[i * 2 + 1] = endY + (Math.random() - 0.5) * 1.0;
    }
    
    return { p0Array, p1Array, p2Array, p3Array };
  }, [count]);

  const instanceAttributes = useMemo(() => ({
    p0: new THREE.InstancedBufferAttribute(bezierData.p0Array, 2),
    p1: new THREE.InstancedBufferAttribute(bezierData.p1Array, 2),
    p2: new THREE.InstancedBufferAttribute(bezierData.p2Array, 2),
    p3: new THREE.InstancedBufferAttribute(bezierData.p3Array, 2),
  }), [bezierData]);

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
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]}>
      <planeGeometry args={[2, 2, 1, 1]}>
        <instancedBufferAttribute attach="attributes-instanceP0" args={[instanceAttributes.p0.array, 2]} />
        <instancedBufferAttribute attach="attributes-instanceP1" args={[instanceAttributes.p1.array, 2]} />
        <instancedBufferAttribute attach="attributes-instanceP2" args={[instanceAttributes.p2.array, 2]} />
        <instancedBufferAttribute attach="attributes-instanceP3" args={[instanceAttributes.p3.array, 2]} />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={bezierVertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          u_resolution: { value: new THREE.Vector2(size.width, size.height) },
          u_time: { value: 0 },
          u_cursorPosition: { value: new THREE.Vector2(0, 0) },
          u_bezierRadius: { value: BEZIER_RADIUS },
          u_color: { value: BEZIER_COLOR },
        } as Record<string, any>}
      />
    </instancedMesh>
  );
}