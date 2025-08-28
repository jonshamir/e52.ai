#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

const int   COUNT     = 200;
const float GOLDEN    = 3.14159265359*(3.0 - sqrt(5.0));
const float SPACING_BASE = 0.045;
const float DOT_R_BASE = 0.01;

float generateNoise(vec2 p, float time) {
    // Multi-directional noise with different wavelengths and phases
    float noise = 0.0;
    
    // Primary diagonal wave
    noise += sin(time * 1.5 + p.x * 15.0 + p.y * 25.0) * 0.08;
    
    // Secondary diagonal wave (different direction)
    noise += sin(time * 2.3 + p.x * 22.0 + p.y * 18.0) * 0.06;
    
    // Horizontal wave
    noise += sin(time * 1.8 + p.x * 35.0 + p.y * 8.0) * 0.05;
    
    // Vertical wave
    noise += sin(time * 2.1 + p.x * 12.0 + p.y * 32.0) * 0.07;
    
    // High frequency detail
    noise += sin(time * 3.2 + p.x * 45.0 + p.y * 55.0) * 0.03;
    
    // Add some randomness with time-based phase shifts
    noise += sin(time * 1.2 + p.x * 28.0 + p.y * 42.0 + sin(time * 0.5) * 10.0) * 0.04;
    
    // Normalize and scale the combined noise to return 0-1
    return (noise + 0.2) * 0.7;
}

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord - 0.5 * u_resolution.xy) / u_resolution.y;
    uv.x -= 0.33;

    // float rot = 0.0 * u_time;
    // mat2 R = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    vec2 p = uv;

    vec3 bg   = vec3(0.04, 0.05, 0.08);
    vec3 dotC = vec3(1.0);

    float dotR = DOT_R_BASE * (800.0 / u_resolution.y);
    float spacing = SPACING_BASE * (800.0 / u_resolution.y);
    float minD = 1e9;

    for (int i = 0; i < COUNT; ++i) {
        float fi = float(i);
        float a  = GOLDEN * fi;
        float r  = spacing * sqrt(fi);
        vec2  c  = r * vec2(cos(a), sin(a));
        
        // Get noise at the dot center to control its radius
        float dotNoise = generateNoise(c, u_time * 2.0);
        float dynamicRadius = dotR * (0.5 + dotNoise * 1.5); // Radius varies from 0.5x to 2x base size
        
        float d = sdCircle(p - c, dynamicRadius);
        minD = min(minD, d);
    }
    
    float aaNoise = fwidth(minD);
    float maskNoise = 1.0 - smoothstep(0.0, aaNoise, minD);
    
    vec3 col = mix(bg, dotC, maskNoise);
    gl_FragColor = vec4(0.369, 0.365, 0.357, maskNoise * 0.7);
}