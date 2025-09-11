import { useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type ViewDependentSpeedOptions = {
  /**
   * Base speed multiplier (default: 1.0)
   */
  baseSpeed?: number;
  /**
   * Optional smoothing factor for speed transitions (0-1, higher = smoother)
   */
  smoothing?: number;
};

/**
 * Custom hook that calculates view-dependent speed based on camera direction.
 * Speed is 100% when viewing head-on (z-forward) and 0% when viewing from the side (x-forward).
 *
 * @param options Configuration options for the speed calculation
 * @returns The current speed multiplier (0-1)
 */
export function useViewDependentSpeed(options: ViewDependentSpeedOptions = {}) {
  const { camera } = useThree();
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const { baseSpeed = 1.0, smoothing = 0.1 } = options;

  useFrame(() => {
    if (camera) {
      // Get camera's forward direction in world space
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      // Normalize the direction vector
      cameraDirection.normalize();

      // Calculate the absolute value of the z-component (forward/backward direction)
      // When viewing head-on (forward = +-(0,0,1)), z-component is close to ±1
      // When viewing from the side (forward = +-(1,0,0)), z-component is close to 0
      const zComponent = Math.abs(cameraDirection.z);

      // Calculate target speed multiplier based on z-component
      // 100% speed when head-on (z-component = 1), 0% speed when side view (z-component = 0)
      const targetSpeedMultiplier = zComponent * baseSpeed;

      // Apply smoothing to prevent jarring transitions
      const smoothedSpeedMultiplier = THREE.MathUtils.lerp(
        speedMultiplier,
        targetSpeedMultiplier,
        smoothing
      );

      setSpeedMultiplier(smoothedSpeedMultiplier);
    }
  });

  return speedMultiplier;
}
