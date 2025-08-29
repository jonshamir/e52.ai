precision mediump float;
attribute vec2 a_position;
uniform vec2 u_resolution;
varying vec2 v_uv;
varying float v_dotR;
varying float v_spacing;

const float DOT_R_BASE = 0.01;
const float SPACING_BASE = 0.045;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = (a_position + 1.0) * 0.5;
  
  // Pre-calculate resolution-dependent scaling
  v_dotR = DOT_R_BASE * (800.0 / u_resolution.y);
  v_spacing = SPACING_BASE * (800.0 / u_resolution.y);
}