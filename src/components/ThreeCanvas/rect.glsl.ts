export const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normalize(vec3(viewMatrix * modelMatrix * vec4(normal, 0.0)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision mediump float;

varying vec2 vUv;
varying vec3 vNormal;

uniform vec3 uColor;
uniform vec4 uRadius;
uniform vec2 uSize;

float sdRoundedBox(in vec2 p, in vec2 b, in vec4 r)
{
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}
void main() {
    vec2 pos = (vUv - vec2(0.5, 0.5)) * 2.0 * uSize;
    float d = sdRoundedBox(pos, uSize, uRadius);
    float pixelSize = sqrt(pow(dFdx(d), 2.0) + pow(dFdy(d), 2.0));
    float alpha = 1.0 - smoothstep(-pixelSize * 1.5, 0.0, d);

    vec3 normal = vNormal.xyz * 0.5 + 0.5;
    // gl_FragColor = vec4(normal, alpha);
    vec3 gammaCorrectedColor = pow(uColor.rgb, vec3(1.0/2.2));
    gl_FragColor = vec4(gammaCorrectedColor, alpha);
}
`;
