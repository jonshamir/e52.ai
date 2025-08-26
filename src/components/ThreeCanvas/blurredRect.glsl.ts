export const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;

uniform vec2 uSize;
uniform float uBlur;

void main() {
    float scaleX = (uSize.x + uBlur) / uSize.x;
    float scaleY = (uSize.y + uBlur) / uSize.y;
    float offsetX = (1.0 - scaleX) / 2.0;
    float offsetY = (1.0 - scaleY) / 2.0;

    vUv = uv * vec2(scaleX, scaleY) + vec2(offsetX, offsetY);
    vec3 pos = position;
    pos.x *= scaleX;
    pos.y *= scaleY;
    vNormal = normalize(vec3(viewMatrix * modelMatrix * vec4(normal, 0.0)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision mediump float;

varying vec2 vUv;
varying vec3 vNormal;

uniform vec3 uColor;
uniform vec4 uRadius;
uniform highp vec2 uSize;
uniform highp float uBlur;

// https://madebyevan.com/shaders/fast-rounded-rectangle-shadows/

// A standard gaussian function, used for weighting samples
float gaussian(float x, float sigma) {
    const float pi = 3.141592653589793;
    return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * pi) * sigma);
}

// This approximates the error function, needed for the gaussian integral
vec2 erf(vec2 x) {
    vec2 s = sign(x), a = abs(x);
    x = 1.0 + (0.278393 + (0.230389 + 0.078108 * (a * a)) * a) * a;
    x *= x;
    return s - s / (x * x);
}

// Return the blurred mask along the x dimension
float roundedBoxShadowX(float x, float y, float sigma, float corner, vec2 halfSize) {
    float delta = min(halfSize.y - corner - abs(y), 0.0);
    float curved = halfSize.x - corner + sqrt(max(0.0, corner * corner - delta * delta));
    vec2 integral = 0.5 + 0.5 * erf((x + vec2(-curved, curved)) * (sqrt(0.5) / sigma));
    return integral.y - integral.x;
}

// Return the mask for the shadow of a box from lower to upper
float roundedBoxShadow(vec2 pos, vec2 size, float sigma, float radius) {
    sigma = sigma * 0.5;
    // The signal is only non-zero in a limited range, so don't waste samples
    float low = pos.y - size.y;
    float high = pos.y + size.y;
    float start = clamp(-3.0 * sigma, low, high);
    float end = clamp(3.0 * sigma, low, high);

    // Accumulate samples (we can get away with surprisingly few samples)
    float step = (end - start) / 4.0;
    float y = start + step * 0.5;
    float value = 0.0;
    for (int i = 0; i < 4; i++) {
        value += roundedBoxShadowX(pos.x, pos.y - y, sigma, radius, size) * gaussian(y, sigma) * step;
        y += step;
    }

    return value;
}


float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r )
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
    // Use at least pixelWidth blur to prevent aliasing
    // float blur = max(uBlur * 0.5, pixelSize / 3.0);
    // float antialiasingOffset = blur - pixelSize;
    // vec2 size = uSize + vec2(antialiasingOffset, antialiasingOffset);
    // float radius = uRadius.x + antialiasingOffset;

    float blur = uBlur * 0.5;
    vec2 size = uSize;
    float radius = uRadius.x;

    float alpha = roundedBoxShadow(pos, size, blur, radius);

    vec3 normal = vNormal.xyz * 0.5 + 0.5;
    vec3 gammaCorrectedColor = pow(uColor.rgb, vec3(1.0/2.2));
    gl_FragColor = vec4(gammaCorrectedColor, alpha);
}
`;
