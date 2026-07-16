export const galaxyVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute vec3 aOriginalPosition;

  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uWindStrength;
  uniform float uWindRadius;

  void main() {
    vColor = aColor;

    vec3 rest = aOriginalPosition;
    vec4 mvPosition = modelViewMatrix * vec4(rest, 1.0);
    vec4 projected = projectionMatrix * mvPosition;
    vec2 ndc = projected.xy / max(projected.w, 0.0001);

    vec2 dir = ndc - uMouse;
    float dist = length(dir);
    float falloff = smoothstep(uWindRadius, 0.0, dist);

    float t = uTime * 3.0 + aPhase;
    float cycle = mod(t, 3.0);
    float spring = sin(cycle * 8.0) * exp(-cycle * 1.8);

    float wave = sin(dist * 18.0 - uTime * 5.0) * exp(-dist * 2.5);

    vec2 pushDir = normalize(dir + vec2(0.0001));
    float displacement = falloff * uWindStrength
      + (1.0 - falloff) * spring * uWindStrength * 0.2
      + wave * uWindStrength * 0.25;

    projected.xy += pushDir * displacement * projected.w;

    gl_PointSize = max(1.6, aSize * uPixelRatio * (560.0 / -mvPosition.z));
    gl_Position = projected;

    vAlpha = 0.6 + 0.4 * sin(uTime * 1.5 + aPhase);
  }
`

export const galaxyFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  uniform float uIntensity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float glow = 1.0 - dist * 2.0;
    glow = pow(glow, 1.1);

    gl_FragColor = vec4(vColor * 1.35 * uIntensity, vAlpha * glow);
  }
`
