import { useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type ViewDependentOpacityOptions = {
  /**
   * If true, opacity is inverse of z-component (transparent head-on, opaque side view)
   * If false, opacity follows z-component (opaque head-on, transparent side view)
   */
  inverse?: boolean;
  /**
   * Optional smoothing factor for opacity transitions (0-1, higher = smoother)
   */
  smoothing?: number;
};

/**
 * Custom hook that calculates view-dependent opacity based on camera direction.
 *
 * @param options Configuration options for the opacity calculation
 * @returns The current opacity value (0-1)
 */
export function useViewDependentOpacity(
  options: ViewDependentOpacityOptions = {}
) {
  const { camera } = useThree();
  const [opacity, setOpacity] = useState(1.0);
  const { inverse = false } = options;

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

      // Calculate target opacity based on inverse setting
      const targetOpacity = inverse ? 1.0 - zComponent : zComponent;

      setOpacity(targetOpacity);
    }
  });

  return opacity;
}

/**
 * Hook for lines that are transparent when viewed head-on and opaque from the side
 */
export function useLinesOpacity(smoothing?: number) {
  return useViewDependentOpacity({ inverse: true, smoothing });
}

/**
 * Hook for circles and tick marks that are opaque when viewed head-on and transparent from the side
 */
export function useCirclesOpacity(smoothing?: number) {
  return useViewDependentOpacity({ inverse: false, smoothing });
}
