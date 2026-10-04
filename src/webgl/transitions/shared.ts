export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sharedFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uTextureA;
  uniform sampler2D uTextureB;
  uniform vec2 uResolution;
  uniform vec2 uTextureASize;
  uniform vec2 uTextureBSize;
  uniform vec2 uMouse;
  uniform float uProgress;
  uniform float uDirection;
  uniform float uReducedMotion;
  varying vec2 vUv;
  #define PI 3.141592653589793

  float random(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(random(i), random(i + vec2(1., 0.)), f.x),
      mix(random(i + vec2(0., 1.)), random(i + vec2(1.)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float value = 0.0, amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(7.1, 3.7);
      amplitude *= 0.5;
    }
    return value;
  }
  vec2 coverUv(vec2 uv, vec2 screenSize, vec2 imageSize) {
    float screenAspect = screenSize.x / screenSize.y;
    float imageAspect = imageSize.x / imageSize.y;
    vec2 scale = vec2(1.0);
    if (screenAspect > imageAspect) scale.y = imageAspect / screenAspect;
    else scale.x = screenAspect / imageAspect;
    return (uv - 0.5) * scale + 0.5;
  }
  vec3 sampleA(vec2 uv) { return texture2D(uTextureA, coverUv(uv, uResolution, uTextureASize)).rgb; }
  vec3 sampleB(vec2 uv) { return texture2D(uTextureB, coverUv(uv, uResolution, uTextureBSize)).rgb; }
`;
