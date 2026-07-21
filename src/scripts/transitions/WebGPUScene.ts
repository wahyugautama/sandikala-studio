export type PlaneBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImagePlane = {
  id: string;
  src: string;
  bounds: PlaneBounds;
  opacity: number;
  scale: number;
  trackedElement: HTMLElement | null;
  imageWidth: number;
  imageHeight: number;
  texture: GPUTexture | null;
  bindGroup: GPUBindGroup | null;
  uniformBuffer: GPUBuffer | null;
  textureReady: boolean;
};

const vertexShader = `
struct Uniforms {
  bounds: vec4f,
  viewport: vec2f,
  imageSize: vec2f,
  opacity: f32,
  scale: f32,
  radius: f32,
  pad: f32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var imageSampler: sampler;
@group(0) @binding(2) var imageTexture: texture_2d<f32>;

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) local: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
  var positions = array<vec2f, 6>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 0.0),
    vec2f(1.0, 1.0)
  );

  let local = positions[vertexIndex];
  let size = u.bounds.zw * u.scale;
  let center = u.bounds.xy + u.bounds.zw * 0.5;
  let pixel = center + (local - vec2f(0.5)) * size;
  let clip = vec2f(
    (pixel.x / u.viewport.x) * 2.0 - 1.0,
    1.0 - (pixel.y / u.viewport.y) * 2.0
  );

  var out: VertexOut;
  out.position = vec4f(clip, 0.0, 1.0);
  out.uv = local;
  out.local = local;
  return out;
}

fn roundedRectAlpha(local: vec2f, size: vec2f, radius: f32) -> f32 {
  if (radius <= 0.0) {
    return 1.0;
  }

  let p = (local - vec2f(0.5)) * size;
  let q = abs(p) - size * 0.5 + vec2f(radius);
  let dist = length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - radius;
  return 1.0 - smoothstep(0.0, 1.0, dist);
}

@fragment
fn fs(input: VertexOut) -> @location(0) vec4f {
  let planeAspect = u.bounds.z / u.bounds.w;
  let imageAspect = u.imageSize.x / u.imageSize.y;
  var sampleUv = input.uv;

  if (imageAspect > planeAspect) {
    let sx = planeAspect / imageAspect;
    sampleUv.x = (input.uv.x - 0.5) * sx + 0.5;
  } else {
    let sy = imageAspect / planeAspect;
    sampleUv.y = (input.uv.y - 0.5) * sy + 0.5;
  }

  let color = textureSample(imageTexture, imageSampler, sampleUv);
  let mask = roundedRectAlpha(input.local, u.bounds.zw, u.radius);
  return vec4f(color.rgb, color.a * u.opacity * mask);
}
`;

const DEBUG_TRANSITIONS = false;

export class WebGPUScene {
  canvas: HTMLCanvasElement;
  planes = new Map<string, ImagePlane>();
  isReady = false;
  isTransitioning = false;

  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private sampler: GPUSampler | null = null;
  private format: GPUTextureFormat | null = null;
  private raf = 0;
  private dpr = 1;
  private textureCache = new Map<string, Promise<{ texture: GPUTexture; width: number; height: number }>>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async init() {
    if (!('gpu' in navigator)) {
      document.documentElement.classList.add('no-webgpu');
      return false;
    }

    try {
      this.adapter = await navigator.gpu.requestAdapter();
      if (!this.adapter) {
        throw new Error('No WebGPU adapter available.');
      }

      this.device = await this.adapter.requestDevice();
      this.context = this.canvas.getContext('webgpu');
      if (!this.context) {
        throw new Error('No WebGPU context available.');
      }

      this.format = navigator.gpu.getPreferredCanvasFormat();
      this.sampler = this.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });

      const shaderModule = this.device.createShaderModule({ code: vertexShader });
      this.pipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module: shaderModule,
          entryPoint: 'vs',
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fs',
          targets: [
            {
              format: this.format,
              blend: {
                color: {
                  srcFactor: 'src-alpha',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
              },
            },
          ],
        },
        primitive: {
          topology: 'triangle-list',
        },
      });

      this.resize();
      this.isReady = true;
      document.documentElement.classList.add('webgpu-ready');
      this.start();
      return true;
    } catch (error) {
      console.warn('[transitions] WebGPU disabled:', error);
      document.documentElement.classList.add('no-webgpu');
      return false;
    }
  }

  resize = () => {
    if (!this.context || !this.device || !this.format) {
      return;
    }

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth * this.dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * this.dpr));
    this.canvas.width = width;
    this.canvas.height = height;

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });
  };

  async syncSlots(root: ParentNode = document) {
    const slots = Array.from(root.querySelectorAll<HTMLElement>('[data-gpu-slot]'));
    const seen = new Set<string>();

    await Promise.all(
      slots.map(async (slot) => {
        const id = slot.dataset.imageId;
        const src = slot.dataset.imageSrc;
        if (!id || !src) return;

        seen.add(id);
        let plane = this.planes.get(id);
        if (!plane) {
          plane = {
            id,
            src,
            bounds: this.getBounds(slot),
            opacity: 1,
            scale: 1,
            trackedElement: slot,
            imageWidth: 1,
            imageHeight: 1,
            texture: null,
            bindGroup: null,
            uniformBuffer: null,
            textureReady: false,
          };
          this.planes.set(id, plane);
        }

        plane.src = src;
        plane.trackedElement = slot;
        plane.bounds = this.getBounds(slot);
        plane.opacity = this.isSlotVisible(slot) ? 1 : 0;

        if (!plane.textureReady) {
          await this.ensureTexture(plane);
        }

        if (DEBUG_TRANSITIONS) {
          slot.style.outline = '1px solid rgba(255,0,0,.5)';
        }
      })
    );

    for (const plane of this.planes.values()) {
      if (!seen.has(plane.id) && !this.isTransitioning) {
        plane.trackedElement = null;
        plane.opacity = 0;
      }
    }
  }

  detachAll() {
    for (const plane of this.planes.values()) {
      if (plane.trackedElement) {
        plane.bounds = this.getBounds(plane.trackedElement);
      }
      plane.trackedElement = null;
    }
  }

  getPlane(id: string | null) {
    return id ? this.planes.get(id) || null : null;
  }

  getBounds(element: HTMLElement): PlaneBounds {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  private isSlotVisible(slot: HTMLElement) {
    if (slot.closest('[aria-hidden="true"]')) return false;
    if (slot.dataset.gpuVisible === 'false') return false;
    const style = window.getComputedStyle(slot);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  private async ensureTexture(plane: ImagePlane) {
    if (!this.device || !this.sampler || !this.pipeline) return;

    const cacheKey = plane.src;
    if (!this.textureCache.has(cacheKey)) {
      this.textureCache.set(cacheKey, this.createTexture(plane.src));
    }

    const result = await this.textureCache.get(cacheKey);
    if (!result || !this.device || !this.sampler || !this.pipeline) return;

    plane.texture = result.texture;
    plane.imageWidth = result.width;
    plane.imageHeight = result.height;
    plane.textureReady = true;

    if (!plane.uniformBuffer) {
      plane.uniformBuffer = this.device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }

    plane.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: plane.uniformBuffer } },
        { binding: 1, resource: this.sampler },
        { binding: 2, resource: plane.texture.createView() },
      ],
    });

    document
      .querySelectorAll<HTMLElement>(`[data-gpu-slot][data-image-id="${CSS.escape(plane.id)}"]`)
      .forEach((slot) => slot.classList.add('is-texture-ready'));
  }

  private async createTexture(src: string) {
    if (!this.device) {
      throw new Error('WebGPU device not ready.');
    }

    const response = await fetch(src, { mode: 'cors' });
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const texture = this.device.createTexture({
      size: [bitmap.width, bitmap.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture },
      [bitmap.width, bitmap.height]
    );

    return {
      texture,
      width: bitmap.width,
      height: bitmap.height,
    };
  }

  private start() {
    if (this.raf) return;
    const tick = () => {
      if (!document.hidden) {
        this.render();
      }
      this.raf = window.requestAnimationFrame(tick);
    };
    this.raf = window.requestAnimationFrame(tick);
  }

  render() {
    if (!this.device || !this.context || !this.pipeline) return;

    for (const plane of this.planes.values()) {
      if (!this.isTransitioning && plane.trackedElement) {
        plane.bounds = this.getBounds(plane.trackedElement);
        plane.opacity = this.isSlotVisible(plane.trackedElement) ? 1 : 0;
      }
    }

    const encoder = this.device.createCommandEncoder();
    const view = this.context.getCurrentTexture().createView();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    pass.setPipeline(this.pipeline);

    for (const plane of this.planes.values()) {
      if (!plane.bindGroup || !plane.uniformBuffer || plane.opacity <= 0.001) {
        continue;
      }

      this.writeUniforms(plane);
      pass.setBindGroup(0, plane.bindGroup);
      pass.draw(6, 1, 0, 0);
    }

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  private writeUniforms(plane: ImagePlane) {
    if (!this.device || !plane.uniformBuffer) return;

    const data = new Float32Array(16);
    data[0] = plane.bounds.x;
    data[1] = plane.bounds.y;
    data[2] = plane.bounds.width;
    data[3] = plane.bounds.height;
    data[4] = window.innerWidth;
    data[5] = window.innerHeight;
    data[6] = plane.imageWidth;
    data[7] = plane.imageHeight;
    data[8] = plane.opacity;
    data[9] = plane.scale;
    data[10] = 0;
    this.device.queue.writeBuffer(plane.uniformBuffer, 0, data);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    this.raf = 0;
    for (const plane of this.planes.values()) {
      plane.texture?.destroy();
      plane.uniformBuffer?.destroy();
    }
    this.planes.clear();
    this.textureCache.clear();
  }
}
