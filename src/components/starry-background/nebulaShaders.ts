export const nebulaVertexShader = `
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const nebulaFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uNebulaA;
  uniform vec3 uNebulaB;
  uniform vec3 uNebulaC;
  uniform float uIntensity;

  varying vec3 vWorldPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldPos);
    vec3 p = dir * 1.5;
    float t = uTime * 0.02;

    float n1 = fbm(p + vec3(t, 0.0, 0.0));
    float n2 = fbm(p * 1.7 + vec3(0.0, t * 1.3, 0.0));
    float n3 = fbm(p * 0.6 + vec3(0.0, 0.0, t * 0.8));

    vec3 color = mix(uNebulaA, uNebulaB, smoothstep(0.3, 0.7, n1));
    color = mix(color, uNebulaC, smoothstep(0.4, 0.85, n2));

    float density = pow(n1 * n2, 1.4);
    density = smoothstep(0.08, 0.7, density);

    float falloff = smoothstep(0.0, 0.45, n3) * 0.6 + 0.4;

    float alpha = density * falloff * uIntensity;
    gl_FragColor = vec4(color * density * falloff * uIntensity, alpha);
  }
`

export const starVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSpeed;

  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkleSpeed;

  void main() {
    vColor = aColor;
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed * uTwinkleSpeed + aPhase);
    vAlpha = 0.35 + 0.65 * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pointSize = aSize * uPixelRatio * (260.0 / max(1.0, -mvPosition.z));
    gl_PointSize = max(1.0, pointSize);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const starFragmentShader = `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.12, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 1.8);

    float brightness = core * 1.3 + glow * 0.55;
    gl_FragColor = vec4(vColor * brightness, vAlpha * (core + glow));
  }
`
