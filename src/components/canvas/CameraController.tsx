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
        const animationDuration = 1000; // 0.5 seconds for animation
        const frontWaitDuration = 3000; // 3 seconds wait at front
        const sideWaitDuration = 1000; // 1 second wait at side
        const totalDuration =
          frontWaitDuration +
          animationDuration +
          sideWaitDuration +
          animationDuration; // 3s + 0.5s + 1s + 0.5s = 5s total

        let progress = 0;
        let targetAngle;

        if (elapsed < frontWaitDuration) {
          // First 3 seconds: hold at 0°
          targetAngle = 0; // Stay at 0 degrees (front view)
        } else if (elapsed < frontWaitDuration + animationDuration) {
          // Next 0.5 seconds: rotate from 0° to 90°
          const animElapsed = elapsed - frontWaitDuration;
          progress = animElapsed / animationDuration;
          targetAngle = (progress * Math.PI) / 2; // 0 to 90 degrees
        } else if (
          elapsed <
          frontWaitDuration + animationDuration + sideWaitDuration
        ) {
          // Next 1 second: hold at 90°
          targetAngle = Math.PI / 2; // Stay at 90 degrees (side view)
        } else {
          // Last 0.5 seconds: rotate from 90° back to 0°
          const backElapsed =
            elapsed - frontWaitDuration - animationDuration - sideWaitDuration;
          progress = backElapsed / animationDuration;
          targetAngle = Math.PI / 2 - (progress * Math.PI) / 2; // 90 to 0 degrees
        }

        // Calculate camera position
        const radius = 5; // Same as initial camera distance
        let x, z;

        if (elapsed < frontWaitDuration) {
          // Hold position during first wait (front view)
          x = Math.sin(targetAngle) * radius;
          z = Math.cos(targetAngle) * radius;
        } else if (elapsed < frontWaitDuration + animationDuration) {
          // Apply smooth easing during first animation
          const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const easedProgress = easeInOutCubic(progress);
          const easedAngle = (easedProgress * Math.PI) / 2;
          x = Math.sin(easedAngle) * radius;
          z = Math.cos(easedAngle) * radius;
        } else if (
          elapsed <
          frontWaitDuration + animationDuration + sideWaitDuration
        ) {
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

        // Set camera position directly during animations, use lerp during waits
        if (
          elapsed < frontWaitDuration ||
          elapsed >= frontWaitDuration + animationDuration + sideWaitDuration
        ) {
          // During wait periods, use smooth interpolation
          camera.position.lerp(new THREE.Vector3(x, 0, z), 0.1);
        } else {
          // During animations, set position directly for smooth motion
          camera.position.set(x, 0, z);
        }
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
