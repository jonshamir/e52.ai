"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LINE_WIDTH } from "./constants";

interface LineData {
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  color?: THREE.Color;
}

const lineVertexShader = /* glsl */ `
attribute vec3 instanceStart;
attribute vec3 instanceEnd;
attribute vec3 instanceColor;

uniform vec2 u_resolution;
uniform float u_lineWidth;

varying vec3 v_color;
varying vec2 v_uv;

void main() {
  // Simple linear interpolation between start and end
  float t = position.x * 0.5 + 0.5; // Convert from [-1,1] to [0,1]
  
  // Linear interpolation between start and end points
  vec3 linePos = mix(instanceStart, instanceEnd, t);
  
  // Calculate line direction
  vec3 direction = normalize(instanceEnd - instanceStart);
  
  // Calculate perpendicular vector for line width
  vec3 up = vec3(0.0, 0.0, 1.0);
  vec3 perpendicular = normalize(cross(direction, up));
  
  // Offset position based on y coordinate and line width
  vec3 worldPosition = linePos + perpendicular * position.y * u_lineWidth;
  
  v_color = instanceColor;
  v_uv = vec2(t, position.y * 0.5 + 0.5);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
}
`;

const lineFragmentShader = /* glsl */ `
varying vec3 v_color;
varying vec2 v_uv;

void main() {
  // Add some anti-aliasing at the edges
  float alpha = 1.0 - smoothstep(0.3, 1.0, abs(v_uv.y - 0.5) * 2.0);
  
  gl_FragColor = vec4(v_color, alpha * 0.8);
}
`;

export default function InstancedLines({ 
  lines, 
  segments = 50 
}: { 
  lines: LineData[], 
  segments?: number 
}) {
  const { size } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // We'll use planeGeometry directly in JSX

  // Create instance attributes
  const instanceAttributes = useMemo(() => {
    const startPositions = new Float32Array(lines.length * 3);
    const endPositions = new Float32Array(lines.length * 3);
    const colors = new Float32Array(lines.length * 3);

    lines.forEach((line, i) => {
      // Start point
      startPositions[i * 3] = line.startPoint.x;
      startPositions[i * 3 + 1] = line.startPoint.y;
      startPositions[i * 3 + 2] = line.startPoint.z;

      // End point
      endPositions[i * 3] = line.endPoint.x;
      endPositions[i * 3 + 1] = line.endPoint.y;
      endPositions[i * 3 + 2] = line.endPoint.z;

      // Color
      const color = line.color || new THREE.Color(0.2, 0.2, 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    return {
      instanceStart: new THREE.InstancedBufferAttribute(startPositions, 3),
      instanceEnd: new THREE.InstancedBufferAttribute(endPositions, 3),
      instanceColor: new THREE.InstancedBufferAttribute(colors, 3),
    };
  }, [lines]);

  // Update resolution uniform when size changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  useFrame(() => {
    if (materialRef.current) {
      // Add any time-based animations here if needed
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, lines.length]}>
      <planeGeometry args={[2, 2, segments, 1]} attach="geometry">
        <instancedBufferAttribute attach="attributes-instanceStart" args={[instanceAttributes.instanceStart.array, 3]} />
        <instancedBufferAttribute attach="attributes-instanceEnd" args={[instanceAttributes.instanceEnd.array, 3]} />
        <instancedBufferAttribute attach="attributes-instanceColor" args={[instanceAttributes.instanceColor.array, 3]} />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={lineVertexShader}
        fragmentShader={lineFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          u_resolution: { value: new THREE.Vector2(size.width, size.height) },
          u_lineWidth: { value: LINE_WIDTH },
        }}
      />
    </instancedMesh>
  );
}