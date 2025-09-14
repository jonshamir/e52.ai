/**
 * Easing utility functions for smooth animations
 */

/**
 * Cubic ease-in-out function
 * Provides smooth acceleration and deceleration
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Linear easing (no easing)
 * @param t - Progress value between 0 and 1
 * @returns Same value as input
 */
export function linear(t: number): number {
  return t;
}

/**
 * Ease-in cubic function
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/**
 * Ease-out cubic function
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
