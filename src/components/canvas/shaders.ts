export const quadVertexShader = /* glsl */ `
attribute vec2 instanceOffset; // per-instance offset in clip space [-1,1]
uniform vec2 u_resolution;     // in pixels
uniform float u_time;
uniform vec2 u_cursorPosition; // normalized device coords (-1..1)
uniform float u_quadRadius;     // configurable radius (pixels)
varying vec2 v_localPos;
varying float v_distanceFromCenter;

void main() {
  // plane geometry is sized 2x2, so position.xy is in [-1,1]
  v_localPos = position.xy;

  // Convert pixel radius to clip-space radius (NDC): 2px/width and 2px/height
  vec2 quadRadius = vec2(2.0 * u_quadRadius / u_resolution.x, 2.0 * u_quadRadius / u_resolution.y);

  // place quad at per-instance offset
  vec2 worldPos = instanceOffset + position.xy * quadRadius;

  // distance from center for falloff (matches fragment’s use)
  v_distanceFromCenter = length(instanceOffset);

  gl_Position = vec4(worldPos, 0.0, 1.0);
}
`;


