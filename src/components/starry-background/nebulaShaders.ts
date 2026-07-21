export const backgroundStarVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSpeed;

  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkleSpeed;
  uniform float uSizeScale;

  void main() {
    vColor = aColor;
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed * uTwinkleSpeed + aPhase);
    vAlpha = 0.4 + 0.6 * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pointSize = aSize * uPixelRatio * uSizeScale * (300.0 / max(1.0, -mvPosition.z));
    gl_PointSize = max(1.0, pointSize);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const backgroundStarFragmentShader = `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.18, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 1.6);

    float brightness = core * 1.6 + glow * 0.6;
    gl_FragColor = vec4(vColor * brightness, vAlpha * (core + glow * 0.7));
  }
`
