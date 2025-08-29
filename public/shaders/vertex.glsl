precision mediump float;
attribute vec2 a_position;    // Quad vertices (-1,-1) to (1,1)
attribute float a_dotIndex;   // Instance data: which dot (0-199)
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_spiralCenter;  // Center offset for the spiral
varying vec2 v_localPos;      // Position within dot quad
varying float v_distanceFromCenter; // Distance from spiral center for opacity falloff

const float DOT_R_BASE = 0.02;
const float SPACING_BASE = 0.08;
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
  float baseR = spacing * sqrt(fi);
  
  // Apply spreading factor: dots spread out more as they get further from center
  float spreadFactor = 0.5 + baseR * baseR;  // Increase spread with distance
  float r = baseR * spreadFactor;
  
  vec2 dotCenter = r * vec2(cos(a), sin(a));
  
  // Calculate dynamic radius with noise
  float dotNoise = generateNoise(dotCenter, u_time * 2.0 + 10.0);
  float dynamicRadius = dotR * (0.5 + dotNoise * 3.0);
  
  // Transform to normalized coordinates matching original fragment shader
  vec2 normalizedPos = dotCenter;
  
  // Transform to clip space with configurable spiral center
  vec2 uv = normalizedPos;
  uv -= u_spiralCenter;  // Apply spiral center offset
  
  // Apply aspect ratio correction like the original fragment shader
  vec2 aspectCorrectedUv = uv;
  aspectCorrectedUv.x *= u_resolution.y / u_resolution.x;  // Correct aspect ratio
  
  // Transform quad vertex to world position with aspect-corrected radius
  vec2 aspectCorrectedRadius = vec2(dynamicRadius * u_resolution.y / u_resolution.x, dynamicRadius);
  vec2 worldPos = aspectCorrectedUv + a_position * aspectCorrectedRadius;
  
  gl_Position = vec4(worldPos, 0.0, 1.0);
  v_localPos = a_position;
  
  // Calculate distance from center for opacity falloff
  v_distanceFromCenter = length(normalizedPos);
}