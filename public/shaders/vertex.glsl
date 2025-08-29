precision mediump float;
attribute vec2 a_position;    // Quad vertices (-1,-1) to (1,1)
attribute float a_dotIndex;   // Instance data: which dot (0-199)
uniform vec2 u_resolution;
uniform float u_time;
varying vec2 v_localPos;      // Position within dot quad

const float DOT_R_BASE = 0.01;
const float SPACING_BASE = 0.045;
const float GOLDEN = 3.14159265359*(3.0 - sqrt(5.0));

float generateNoise(vec2 p, float time) {
    float noise = 0.0;
    noise += sin(time * 1.5 + p.x * 15.0 + p.y * 25.0) * 0.08;
    noise += sin(time * 2.3 + p.x * 22.0 + p.y * 18.0) * 0.06;
    noise += sin(time * 1.8 + p.x * 35.0 + p.y * 8.0) * 0.05;
    noise += sin(time * 1.2 + p.x * 28.0 + p.y * 42.0 + sin(time * 0.5) * 10.0) * 0.04;
    return (noise + 0.2) * 0.7;
}

void main() {
  // Calculate resolution-dependent scaling
  float dotR = DOT_R_BASE * (800.0 / u_resolution.y);
  float spacing = SPACING_BASE * (800.0 / u_resolution.y);
  
  // Calculate dot center from golden ratio spiral
  float fi = a_dotIndex;
  float a = GOLDEN * fi;
  float r = spacing * sqrt(fi);
  vec2 dotCenter = r * vec2(cos(a), sin(a));
  
  // Calculate dynamic radius with noise
  float dotNoise = generateNoise(dotCenter, u_time * 2.0 + 10.0);
  float dynamicRadius = dotR * (0.5 + dotNoise * 2.0);
  
  // Transform to normalized coordinates matching original fragment shader
  vec2 normalizedPos = dotCenter;
  
  // Transform to screen coordinates like the original
  vec2 screenPos = (normalizedPos * u_resolution.y + 0.5 * u_resolution.xy);
  vec2 uv = (screenPos - 0.5 * u_resolution.xy) / u_resolution.y;
  uv.x -= 0.33;  // Original horizontal offset
  
  // Transform quad vertex to world position  
  vec2 worldPos = uv + a_position * dynamicRadius;
  
  gl_Position = vec4(worldPos, 0.0, 1.0);
  v_localPos = a_position;
}