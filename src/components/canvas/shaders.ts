export const quadVertexShader = /* glsl */ `
attribute vec2 instanceOffset; // per-instance offset in world space
uniform vec2 u_resolution;     // in pixels
uniform float u_time;
uniform vec2 u_cursorPosition; // normalized device coords (-1..1)
uniform float u_quadRadius;    // configurable radius (pixels)
varying vec2 v_localPos;
varying float v_distanceFromCenter;

void main() {
  // plane geometry is sized 2x2, so position.xy is in [-1,1]
  v_localPos = position.xy;

  // Scale the quad to pixel size in world space
  // For orthographic camera, world units = pixels when zoom = 1
  vec3 scaledPosition = position * u_quadRadius;
  
  // Apply per-instance offset in world space
  vec3 worldPosition = scaledPosition + vec3(instanceOffset * min(u_resolution.x, u_resolution.y) * 0.5, 0.0);

  // distance from center for falloff (in world space)
  v_distanceFromCenter = length(instanceOffset);

  // Use Three.js projection matrix for proper orthographic projection
  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
}
`;

export const bezierVertexShader = /* glsl */ `
precision mediump float;
attribute vec2 instanceP0; // bezier start point
attribute vec2 instanceP1; // bezier control point
attribute vec2 instanceP2; // bezier end point
uniform vec2 u_resolution;     // in pixels
uniform float u_time;
uniform vec2 u_cursorPosition; // normalized device coords (-1..1)
uniform mediump float u_bezierRadius;  // curve thickness radius (pixels)
varying vec2 v_localPos;
varying vec2 v_p0;
varying vec2 v_p1;
varying vec2 v_p2;
varying float v_distanceFromCenter;

void main() {
  // plane geometry is sized 2x2, so position.xy is in [-1,1]
  v_localPos = position.xy;

  // Pass bezier control points to fragment shader
  v_p0 = instanceP0;
  v_p1 = instanceP1;
  v_p2 = instanceP2;

  // DEBUG: Use simple positioning like Quads component
  // Scale the quad to a fixed size for now
  vec3 scaledPosition = position * 100.0; // Fixed size in pixels
  
  // Position at center of quadratic bezier curve (average of start and end points)
  vec2 center = (instanceP0 + instanceP2) * 0.5;
  vec3 worldPosition = scaledPosition + vec3(center * min(u_resolution.x, u_resolution.y) * 0.5, 0.0);

  // distance from center for falloff (in world space)
  v_distanceFromCenter = length(center);

  // Use Three.js projection matrix for proper orthographic projection
  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
}
`;


