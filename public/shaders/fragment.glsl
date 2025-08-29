#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying vec2 v_localPos;      // Position within dot quad (-1,-1) to (1,1)
varying float v_distanceFromCenter; // Distance from spiral center for opacity falloff

void main() {
    // Create circle SDF within the quad
    float d = length(v_localPos) - 1.0;
    float aaNoise = fwidth(d);
    
    float mask = 1.0 - smoothstep(-aaNoise, 0.0, d);
    
    // Apply opacity falloff based on distance from center
    float opacityFalloff = exp(-v_distanceFromCenter * 0.8); // Exponential falloff
    float finalAlpha = mask * opacityFalloff;
    
    gl_FragColor = vec4(0.369, 0.365, 0.357, clamp(finalAlpha, 0.0, 1.0)) * 0.5;
}