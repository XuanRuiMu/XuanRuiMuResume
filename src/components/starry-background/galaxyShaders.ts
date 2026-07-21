export const spiralStarVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aRadius;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vRadius;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkleSpeed;
  uniform float uSizeScale;

  void main() {
    vColor = aColor;
    vRadius = aRadius;
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed * uTwinkleSpeed + aPhase);
    vAlpha = 0.35 + 0.65 * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pointSize = aSize * uPixelRatio * uSizeScale * (300.0 / max(1.0, -mvPosition.z));
    gl_PointSize = max(1.0, pointSize);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const spiralStarFragmentShader = `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vRadius;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.12, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 1.8);

    float brightness = core * 2.1 + glow * 0.95;
    vec3 finalColor = vColor * brightness;
    gl_FragColor = vec4(finalColor, vAlpha * (core + glow * 0.85));
  }
`

export const nebulaVolumeVertexShader = `
  varying vec3 vLocalPos;

  uniform float uSphereRadius;

  void main() {
    vLocalPos = position * uSphereRadius;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const nebulaVolumeFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorEdge;
  uniform float uIntensity;
  uniform float uArmCount;
  uniform float uArmTightness;
  uniform float uDiscThickness;
  uniform float uGalaxyRadius;
  uniform float uSphereRadius;
  uniform float uStepCount;
  uniform float uFbmOctaves;
  uniform float uTurbulenceScale;
  uniform float uTurbulenceSpeed;
  uniform mat4 uInverseModelMatrix;

  varying vec3 vLocalPos;

  const float TWO_PI = 6.28318530718;

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

  float fbm(vec3 p, float octaves) {
    float v = 0.0;
    float a = 0.5;
    float total = 0.0;
    for (int i = 0; i < 6; i++) {
      if (float(i) >= octaves) break;
      v += a * noise(p);
      total += a;
      p *= 2.07;
      a *= 0.5;
    }
    return v / max(0.0001, total);
  }

  vec3 curlField(vec3 p) {
    float eps = 0.18;
    float n_xp = fbm(p + vec3(eps, 0.0, 0.0), 2.0);
    float n_xn = fbm(p - vec3(eps, 0.0, 0.0), 2.0);
    float n_yp = fbm(p + vec3(0.0, eps, 0.0), 2.0);
    float n_yn = fbm(p - vec3(0.0, eps, 0.0), 2.0);
    float n_zp = fbm(p + vec3(0.0, 0.0, eps), 2.0);
    float n_zn = fbm(p - vec3(0.0, 0.0, eps), 2.0);
    return vec3(n_yp - n_yn, n_zp - n_zn, n_xp - n_xn) / (2.0 * eps);
  }

  float spiralArmDensity(vec3 p) {
    float r = length(p.xz);
    if (r < 0.001) return 1.0;

    float theta = atan(p.z, p.x);
    float log_r = log(max(r, 0.001));
    float armOffset = uArmTightness * log_r;
    float armSpacing = TWO_PI / max(1.0, uArmCount);
    float angleDiff = mod(theta - armOffset + armSpacing * 0.5 + TWO_PI, armSpacing) - armSpacing * 0.5;

    float armWidth = 0.14 + 0.08 * (r / uGalaxyRadius);
    float armDensity = exp(-(angleDiff * angleDiff) / (2.0 * armWidth * armWidth));

    float bulge = exp(-r * r * 6.0 / (uGalaxyRadius * uGalaxyRadius));
    return max(armDensity * (1.0 - bulge * 0.6), bulge * 0.85);
  }

  float densityField(vec3 p) {
    float r2 = p.x * p.x + p.z * p.z;
    if (r2 > uGalaxyRadius * uGalaxyRadius) return 0.0;

    float r = sqrt(r2);
    float normalizedR = r / max(0.0001, uGalaxyRadius);

    float verticalDensity = exp(-(p.y * p.y) / max(0.0001, uDiscThickness * uDiscThickness));
    float armDensity = spiralArmDensity(p);

    vec3 turbPos = p * uTurbulenceScale + vec3(uTime * uTurbulenceSpeed, 0.0, uTime * uTurbulenceSpeed * 0.6);
    vec3 curl = curlField(turbPos * 0.5);
    float turb = fbm(turbPos + curl * 0.3, uFbmOctaves);
    float turbulence = 0.45 + 0.55 * turb;

    float radialFalloff = 1.0 - smoothstep(0.7, 1.0, normalizedR);
    float coreBoost = exp(-normalizedR * normalizedR * 18.0);

    float density = armDensity * verticalDensity * turbulence * radialFalloff;
    density = max(density, coreBoost * verticalDensity * 0.9);
    return clamp(density, 0.0, 1.0);
  }

  vec3 colorByRadius(float normalizedR) {
    vec3 color;
    if (normalizedR < 0.35) {
      float t = smoothstep(0.0, 0.35, normalizedR);
      color = mix(uColorCore, uColorMid, t);
    } else {
      float t = smoothstep(0.35, 1.0, normalizedR);
      color = mix(uColorMid, uColorEdge, t);
    }
    return color;
  }

  void main() {
    vec3 localCameraUnit = (uInverseModelMatrix * vec4(cameraPosition, 1.0)).xyz;
    vec3 localCamera = localCameraUnit * uSphereRadius;
    vec3 rayDir = normalize(vLocalPos - localCamera);

    float b = dot(localCamera, rayDir);
    float c = dot(localCamera, localCamera) - uSphereRadius * uSphereRadius;
    float disc = b * b - c;
    if (disc < 0.0) discard;

    float tFront = max(0.0, -b - sqrt(disc));
    float tBack = -b + sqrt(disc);

    vec3 startPos = localCamera + rayDir * tFront;
    float marchLength = tBack - tFront;
    if (marchLength < 0.001) discard;

    float stepCount = max(8.0, uStepCount);
    float stepSize = marchLength / stepCount;

    vec3 pos = startPos;
    vec3 accumColor = vec3(0.0);
    float accumAlpha = 0.0;

    for (int i = 0; i < 64; i++) {
      if (float(i) >= stepCount) break;
      if (accumAlpha > 0.96) break;

      float density = densityField(pos);
      if (density > 0.001) {
        float r = length(pos.xz);
        float normalizedR = clamp(r / max(0.0001, uGalaxyRadius), 0.0, 1.0);
        vec3 color = colorByRadius(normalizedR);

        float sampleAlpha = density * 0.14 * uIntensity;
        accumColor += (1.0 - accumAlpha) * color * sampleAlpha;
        accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
      }

      pos += rayDir * stepSize;
    }

    if (accumAlpha < 0.003) discard;
    gl_FragColor = vec4(accumColor, accumAlpha);
  }
`

export const starCoreVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const starCoreFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uCoreColor;
  uniform vec3 uGlowColor;
  uniform float uIntensity;
  uniform float uPulseSpeed;
  uniform float uGlowFalloff;

  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;
    if (dist > 1.0) discard;

    float core = 1.0 - smoothstep(0.0, 0.08, dist);
    float innerGlow = 1.0 - smoothstep(0.0, 0.25, dist);
    innerGlow = pow(innerGlow, 1.6);
    float midGlow = 1.0 - smoothstep(0.0, 0.55, dist);
    midGlow = pow(midGlow, uGlowFalloff);
    float outerGlow = 1.0 - smoothstep(0.0, 1.0, dist);
    outerGlow = pow(outerGlow, uGlowFalloff + 1.2);

    float pulse = 0.82 + 0.18 * sin(uTime * uPulseSpeed);
    float corePulse = 0.9 + 0.1 * sin(uTime * uPulseSpeed * 1.6);

    vec3 color = uCoreColor * core * 2.4 * corePulse
      + uGlowColor * (innerGlow * 1.3 + midGlow * 0.7 + outerGlow * 0.35);
    float alpha = (core * 1.2 + innerGlow * 0.85 + midGlow * 0.45 + outerGlow * 0.18) * pulse * uIntensity;

    gl_FragColor = vec4(color * pulse, alpha);
  }
`
