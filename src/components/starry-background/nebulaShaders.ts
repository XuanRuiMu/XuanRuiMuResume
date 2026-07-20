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

    vec3 color = mix(uNebulaA, uNebulaB, smoothstep(0.2, 0.8, n1));
    color = mix(color, uNebulaC, smoothstep(0.3, 0.85, n2));

    // 密度：去掉 pow，降低 smoothstep 下限，让星云覆盖更多区域
    float density = n1 * n2;
    density = smoothstep(0.02, 0.55, density);

    // falloff 增强对比度
    float falloff = smoothstep(0.05, 0.55, n3) * 0.7 + 0.3;

    // alpha 控制透明度（Additive 混合下 alpha 影响较小，主要靠颜色亮度）
    float alpha = clamp(density * falloff * uIntensity, 0.0, 1.0);
    // 颜色亮度独立于 density，确保星云颜色鲜艳可见
    // density 越高颜色越亮，但保持基础亮度
    float colorBrightness = (density * 0.6 + 0.4) * falloff * uIntensity * 1.8;
    vec3 finalColor = color * colorBrightness;
    gl_FragColor = vec4(finalColor, alpha);
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
    vAlpha = 0.45 + 0.55 * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // 增大恒星：260 → 340
    float pointSize = aSize * uPixelRatio * (340.0 / max(1.0, -mvPosition.z));
    gl_PointSize = max(1.5, pointSize);
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

    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 1.6);

    // 提高亮度：core 1.3→1.8, glow 0.55→0.85
    float brightness = core * 1.8 + glow * 0.85;
    gl_FragColor = vec4(vColor * brightness, vAlpha * (core + glow * 0.8));
  }
`
