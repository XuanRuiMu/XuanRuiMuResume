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
  uniform float uPushStrength;
  uniform float uPushRadius;
  uniform float uPushDamping;

  void main() {
    vColor = aColor;

    vec3 rest = aOriginalPosition;

    float cameraZ = 14.0;
    float fovScale = 0.577;
    vec2 mouseWorld = uMouse * cameraZ * fovScale;

    vec2 dir = rest.xz - mouseWorld;
    float dist = length(dir);
    vec2 pushDir = normalize(dir + vec2(0.0001));

    float influence = 1.0 - smoothstep(0.0, uPushRadius, dist);
    vec3 push = vec3(pushDir.x, 0.0, pushDir.y) * influence * uPushStrength;

    float t = uTime * 3.0 + aPhase;
    float cycle = mod(t, 3.0);
    float spring = sin(cycle * 6.0) * exp(-cycle * uPushDamping * 0.6);
    vec3 recovery = vec3(pushDir.x, 0.0, pushDir.y) * spring * uPushStrength * 0.25;

    float wave = sin(dist * 4.0 - uTime * 5.0) * exp(-dist * 0.8) * uPushStrength * 0.15;
    vec3 ambient = vec3(pushDir.x, 0.0, pushDir.y) * wave;

    vec3 displaced = rest + push + recovery + ambient;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vec4 projected = projectionMatrix * mvPosition;

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
