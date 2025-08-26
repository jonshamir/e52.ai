import { useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";

import { fragmentShader, vertexShader } from "./blurredRect.glsl";
import { RectProps } from "./Rect";

export type BlurredRectRef = {
  setColor: (color: THREE.ColorRepresentation) => void;
  setRadius: (radius: number) => void;
  setSize: (size: { x: number; y: number }) => void;
  setBlur: (blur: number) => void;
  setPosition: (position: [number, number, number]) => void;
};

export type BlurredRectProps = RectProps & {
  blur?: number;
  ref?: React.RefObject<BlurredRectRef>;
};

type BlurredRectUniforms = {
  uColor: { value: THREE.Color };
  uRadius: { value: THREE.Vector4 };
  uSize: { value: THREE.Vector2 };
  uBlur: { value: number };
};

export function BlurredRect(props: BlurredRectProps) {
  const {
    color = "",
    radius = 0,
    depthTest = true,
    size = { x: 1, y: 1 },
    blur = 0,
    position = [0, 0, 0],
    ref,
    ...rest
  } = props;

  const meshRef = useRef<THREE.Mesh>(null);
  const uniformsRef = useRef<BlurredRectUniforms>({
    uColor: { value: new THREE.Color(color) },
    uRadius: { value: new THREE.Vector4(radius, radius, radius, radius) },
    uSize: { value: new THREE.Vector2(size.x, size.y) },
    uBlur: { value: blur },
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        setColor(color: THREE.ColorRepresentation) {
          uniformsRef.current.uColor.value.set(color);
        },
        setRadius(radius: number) {
          uniformsRef.current.uRadius.value.set(radius, radius, radius, radius);
        },
        setSize(size: { x: number; y: number }) {
          uniformsRef.current.uSize.value.set(size.x, size.y);
        },
        setBlur(blur: number) {
          uniformsRef.current.uBlur.value = blur;
        },
        setPosition(position: [number, number, number]) {
          if (meshRef.current) {
            meshRef.current.position.set(position[0], position[1], position[2]);
          }
        },
      };
    },
    []
  );

  useEffect(() => {
    if (uniformsRef.current === undefined) return;
    // Update uniforms when props change
    uniformsRef.current.uColor.value.set(color);
    const r = Math.min(radius, Math.min(size.x, size.y));
    uniformsRef.current.uRadius.value.set(r, r, r, r);
    uniformsRef.current.uSize.value.set(size.x, size.y);
    uniformsRef.current.uBlur.value = blur;
  }, [color, radius, size, blur]);

  return (
    <mesh ref={meshRef} position={position} {...rest}>
      <planeGeometry args={[size.x, size.y]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthTest={depthTest}
        depthWrite={false}
        transparent={true}
        side={THREE.DoubleSide}
        uniforms={uniformsRef.current}
      />
    </mesh>
  );
}
