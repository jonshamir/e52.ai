#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying vec2 v_localPos;      // Position within bezier quad (-1,-1) to (1,1)
varying vec2 v_p0;            // Bezier start point
varying vec2 v_p1;            // Bezier control point
varying vec2 v_p2;            // Bezier end point
varying float v_distanceFromCenter; // Distance from curve center for opacity falloff

uniform mediump float u_bezierRadius; // Curve thickness radius
uniform vec2 u_resolution;    // Screen resolution

// Distance to quadratic bezier curve from Shadertoy
float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C) {
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;

    float kk = 1.0 / dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);

    float res = 0.0;

    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
    float h = q*q + 4.0*p3;

    if(h >= 0.0) { 
        h = sqrt(h);
        vec2 x = (vec2(h, -h) - q) / 2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = uv.x + uv.y - kx;
        t = clamp( t, 0.0, 1.0 );

        // 1 root
        vec2 qos = d + (c + b*t)*t;
        res = length(qos);
    } else {
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
        t = clamp( t, 0.0, 1.0 );

        // 3 roots
        vec2 qos = d + (c + b*t.x)*t.x;
        float dis = dot(qos,qos);
        
        qos = d + (c + b*t.y)*t.y;
        dis = min(dis,dot(qos,qos));
        
        qos = d + (c + b*t.z)*t.z;
        dis = min(dis,dot(qos,qos));
        
        res = sqrt(dis);
    }
    
    return res;
}

void main() {
    // Convert normalized device coordinates to world space
    vec2 worldPos = v_localPos;
    
    // Calculate distance to quadratic bezier curve
    float d = sdBezier(worldPos, v_p0, v_p1, v_p2);
    
    // Convert to pixel-based radius
    float pixelRadius = u_bezierRadius / min(u_resolution.x, u_resolution.y) * 2.0;
    d = d - pixelRadius;
    
    // Anti-aliasing
    float aaNoise = fwidth(d);
    float mask = 1.0 - smoothstep(-aaNoise, 0.0, d);
    
    // Apply opacity falloff based on distance from center
    float finalAlpha = mask;
    
    gl_FragColor = vec4(0.2, 0.2, 0.2, clamp(finalAlpha, 0.0, 1.0));
}