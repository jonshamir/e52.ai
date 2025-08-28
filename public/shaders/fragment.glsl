#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

const int   COUNT     = 200;
const float GOLDEN    = 3.14159265359*(3.0 - sqrt(5.0));
const float SPACING_BASE = 0.035;
const float DOT_R_BASE = 0.008;

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
        float d  = sdCircle(p - c, dotR);
        minD = min(minD, d);
    }

    float aa    = fwidth(minD);
    float mask  = 1.0 - smoothstep(0.0, aa, minD);
    float noise = (sin(u_time * 2.0 + p.x * 10.0 + p.y * 40.0) + 1.5) * 0.1;

    vec3 col = mix(bg, dotC, mask);
    gl_FragColor = vec4(0.0, 0.0, 0.0, mask * noise);
}