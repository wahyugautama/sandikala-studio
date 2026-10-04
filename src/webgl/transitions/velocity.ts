import { sharedFragment } from './shared';

export const velocityShader = `${sharedFragment}
  void main() {
    float progress = clamp(uProgress, 0.0, 1.0);
    if (uReducedMotion > 0.5) {
      gl_FragColor = vec4(mix(sampleA(vUv), sampleB(vUv), smoothstep(0.0, 1.0, progress)), 1.0);
      return;
    }

    float p = smoothstep(0.0, 1.0, progress);
    float energy = sin(p * PI);
    vec2 baseUv = vUv + uMouse * 0.0022 * (1.0 - energy);
    float coarse = fbm(baseUv * vec2(2.2, 7.0));
    float fine = noise(baseUv * vec2(5.0, 38.0));
    float smear = ((coarse - 0.5) * 0.75 + (fine - 0.5) * 0.25) * energy;
    float centerStretch = (baseUv.y - 0.5) * energy * 0.025;
    float zoom = 1.0 - energy * 0.022;
    vec2 uvA = (baseUv - 0.5) * zoom + 0.5;
    vec2 uvB = uvA;
    uvA.y += (smear * 0.095 + energy * 0.036 + centerStretch) * uDirection;
    uvB.y -= (smear * 0.078 + energy * 0.036 - centerStretch) * uDirection;
    uvA.x += smear * 0.01;
    uvB.x -= smear * 0.01;

    float field = mix(coarse, uDirection > 0.0 ? 1.0 - baseUv.y : baseUv.y, 0.52);
    float threshold = mix(-0.2, 1.2, p);
    float reveal = smoothstep(field - 0.16, field + 0.16, threshold);
    vec3 colorA = sampleA(uvA);
    vec3 colorB = sampleB(uvB);
    float rgbShift = energy * 0.0025;
    colorA.r = sampleA(uvA + vec2(rgbShift, 0.0)).r;
    colorA.b = sampleA(uvA - vec2(rgbShift, 0.0)).b;
    colorB.r = sampleB(uvB - vec2(rgbShift, 0.0)).r;
    colorB.b = sampleB(uvB + vec2(rgbShift, 0.0)).b;
    if (progress <= 0.001) reveal = 0.0;
    if (progress >= 0.999) reveal = 1.0;
    gl_FragColor = vec4(mix(colorA, colorB, reveal), 1.0);
  }
`;
