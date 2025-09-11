"use client";

import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function CameraController() {
  const { camera } = useThree();
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  useEffect(() => {
    const startAnimation = () => {
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      startTimeRef.current = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const animationDuration = 500; // 0.5 seconds for animation
        const waitDuration = 3000; // 3 seconds wait
        const totalDuration =
          waitDuration + animationDuration + waitDuration + animationDuration; // 3s + 0.5s + 3s + 0.5s = 7s total

        let progress = 0;
        let targetAngle;

        if (elapsed < waitDuration) {
          // First 3 seconds: hold at 0°
          targetAngle = 0; // Stay at 0 degrees (front view)
        } else if (elapsed < waitDuration + animationDuration) {
          // Next 0.5 seconds: rotate from 0° to 90°
          const animElapsed = elapsed - waitDuration;
          progress = animElapsed / animationDuration;
          targetAngle = (progress * Math.PI) / 2; // 0 to 90 degrees
        } else if (elapsed < waitDuration + animationDuration + waitDuration) {
          // Next 3 seconds: hold at 90°
          targetAngle = Math.PI / 2; // Stay at 90 degrees (side view)
        } else {
          // Last 0.5 seconds: rotate from 90° back to 0°
          const backElapsed =
            elapsed - waitDuration - animationDuration - waitDuration;
          progress = backElapsed / animationDuration;
          targetAngle = Math.PI / 2 - (progress * Math.PI) / 2; // 90 to 0 degrees
        }

        // Calculate camera position
        const radius = 5; // Same as initial camera distance
        let x, z;

        if (elapsed < waitDuration) {
          // Hold position during first wait (front view)
          x = Math.sin(targetAngle) * radius;
          z = Math.cos(targetAngle) * radius;
        } else if (elapsed < waitDuration + animationDuration) {
          // Apply smooth easing during first animation
          const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const easedProgress = easeInOutCubic(progress);
          const easedAngle = (easedProgress * Math.PI) / 2;
          x = Math.sin(easedAngle) * radius;
          z = Math.cos(easedAngle) * radius;
        } else if (elapsed < waitDuration + animationDuration + waitDuration) {
          // Hold position during second wait (side view)
          x = Math.sin(targetAngle) * radius;
          z = Math.cos(targetAngle) * radius;
        } else {
          // Apply smooth easing during second animation
          const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const easedProgress = easeInOutCubic(progress);
          const easedAngle = Math.PI / 2 - (easedProgress * Math.PI) / 2;
          x = Math.sin(easedAngle) * radius;
          z = Math.cos(easedAngle) * radius;
        }

        // Smoothly interpolate camera position
        camera.position.lerp(new THREE.Vector3(x, 0, z), 0.1);
        camera.lookAt(0, 0, 0);

        // Continue animation if not complete
        if (elapsed < totalDuration) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete, restart after a brief pause
          isAnimatingRef.current = false;
          setTimeout(() => {
            startAnimation();
          }, 100); // Small delay before restarting
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    startAnimation();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera]);

  return null; // This component doesn't render anything
}
