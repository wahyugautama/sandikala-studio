import * as THREE from 'three';
import { gsap } from 'gsap';
import { vertexShader } from '../../webgl/transitions/shared';
import { velocityShader } from '../../webgl/transitions/velocity';

type ShowcaseProject = { title: string; image: string; type: string; industry: string; href: string };
type LoadedTexture = { texture: THREE.Texture; size: THREE.Vector2; valid: boolean };

declare global { interface Window { __projectShowcaseCleanup?: () => void } }

const TRANSITION_DURATION = 950;
const AUTOPLAY_INTERVAL = 5000;

const fallbackTexture = (): LoadedTexture => {
  const texture = new THREE.DataTexture(new Uint8Array([39, 39, 34, 255]), 1, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return { texture, size: new THREE.Vector2(1, 1), valid: false };
};

const loadTexture = (loader: THREE.TextureLoader, url: string): Promise<LoadedTexture> => new Promise((resolve) => {
  let settled = false;
  const finish = (value: LoadedTexture) => {
    if (settled) { value.texture.dispose(); return; }
    settled = true;
    window.clearTimeout(timer);
    resolve(value);
  };
  const timer = window.setTimeout(() => finish(fallbackTexture()), 9000);
  loader.load(url, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const image = texture.image as { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number };
    finish({ texture, size: new THREE.Vector2(image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1), valid: true });
  }, undefined, () => finish(fallbackTexture()));
});

export function destroyProjectShowcase() {
  window.__projectShowcaseCleanup?.();
  window.__projectShowcaseCleanup = undefined;
}

export async function initProjectShowcase() {
  destroyProjectShowcase();
  const root = document.querySelector<HTMLElement>('[data-project-showcase]');
  if (!root) return;
  const host = root.querySelector<HTMLElement>('[data-showcase-webgl]');
  const fallback = root.querySelector<HTMLImageElement>('[data-showcase-fallback]');
  const data = root.querySelector<HTMLScriptElement>('[data-showcase-projects]');
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-project-button]'));
  const title = root.querySelector<HTMLAnchorElement>('[data-project-title]');
  const titleText = root.querySelector<HTMLElement>('[data-project-title-text]');
  const indexText = root.querySelector<HTMLElement>('[data-project-index]');
  const typeText = root.querySelector<HTMLElement>('[data-project-type]');
  const progressText = root.querySelector<HTMLElement>('[data-project-progress]');
  const industryText = root.querySelector<HTMLElement>('[data-project-industry]');
  const autoplayToggle = root.querySelector<HTMLButtonElement>('[data-autoplay-toggle]');
  if (!host || !fallback || !data || !title || !titleText || !indexText || !typeText || !progressText || !industryText || !autoplayToggle) return;

  const projects = JSON.parse(data.textContent || '[]') as ShowcaseProject[];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  let disposed = false;
  let activeIndex = 0;
  let transitionLocked = false;
  let transitionRaf = 0;
  let renderRaf = 0;
  let autoplayTimer = 0;
  let autoplayEnabled = !reducedMotion;
  let textures: LoadedTexture[] = [];
  let renderer: THREE.WebGLRenderer | undefined;
  let material: THREE.ShaderMaterial | undefined;
  let geometry: THREE.PlaneGeometry | undefined;
  let scene: THREE.Scene | undefined;
  let camera: THREE.OrthographicCamera | undefined;
  const pointerTarget = new THREE.Vector2();
  const pointer = new THREE.Vector2();

  const updateAutoplayToggle = () => {
    autoplayToggle.textContent = `Autoplay ${autoplayEnabled ? 'on' : 'off'}`;
    autoplayToggle.setAttribute('aria-pressed', String(autoplayEnabled));
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = 0;
    root.classList.remove('is-autoplaying');
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (!autoplayEnabled || projects.length < 2) return;
    void root.offsetWidth;
    root.classList.add('is-autoplaying');
    autoplayTimer = window.setInterval(() => {
      if (!transitionLocked && !document.hidden) changeProject((activeIndex + 1) % projects.length);
    }, AUTOPLAY_INTERVAL);
  };

  const onAutoplayToggle = () => {
    autoplayEnabled = !autoplayEnabled;
    updateAutoplayToggle();
    startAutoplay();
  };

  updateAutoplayToggle();

  const renderSplitText = (element: HTMLElement, value: string) => {
    element.textContent = '';
    element.setAttribute('aria-label', value);
    value.split(' ').forEach((word, wordIndex, words) => {
      const wordNode = document.createElement('span');
      wordNode.className = 'split-word';
      wordNode.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach((character) => {
        const charNode = document.createElement('span');
        charNode.className = 'split-char';
        charNode.dataset.char = '';
        charNode.textContent = character;
        wordNode.appendChild(charNode);
      });
      element.appendChild(wordNode);
      if (wordIndex < words.length - 1) element.appendChild(document.createTextNode(' '));
    });
  };

  const animateText = (element: HTMLElement, value: string, direction: number, stagger: number) => {
    const oldChars = Array.from(element.querySelectorAll<HTMLElement>('[data-char]'));
    gsap.killTweensOf(oldChars);
    if (reducedMotion || !oldChars.length) { renderSplitText(element, value); return; }
    gsap.to(oldChars, {
      yPercent: direction * -120, opacity: 0, duration: 0.2,
      stagger: { each: stagger, from: direction > 0 ? 'start' : 'end' }, ease: 'power2.in',
      onComplete: () => {
        renderSplitText(element, value);
        gsap.fromTo(element.querySelectorAll('[data-char]'),
          { yPercent: direction * 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.36, stagger, ease: 'power3.out', clearProps: 'transform,opacity' });
      },
    });
  };

  renderSplitText(titleText, projects[0].title);
  renderSplitText(typeText, projects[0].type);
  renderSplitText(industryText, projects[0].industry);

  const updateUi = (index: number, direction: number) => {
    const project = projects[index];
    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    indexText.textContent = `${String(index + 1).padStart(3, '0')}.`;
    progressText.textContent = `${Math.round(((index + 1) / projects.length) * 100)}%`;
    title.href = project.href;
    title.setAttribute('aria-label', `View ${project.title} case study`);
    animateText(typeText, project.type, direction, 0.01);
    animateText(industryText, project.industry, direction, 0.01);
    animateText(titleText, project.title, direction, 0.016);
  };

  const resize = () => {
    if (!renderer || !material) return;
    const width = innerWidth, height = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarsePointer ? 1.5 : 2));
    renderer.setSize(width, height, false);
    material.uniforms.uResolution.value.set(width, height);
  };

  const changeProject = (nextIndex: number) => {
    if (!material || transitionLocked || nextIndex === activeIndex || nextIndex < 0 || nextIndex >= projects.length) return;
    const previousIndex = activeIndex;
    const direction = nextIndex > previousIndex ? 1 : -1;
    transitionLocked = true;
    updateUi(nextIndex, direction);
    const uniforms = material.uniforms;
    uniforms.uTextureA.value = textures[previousIndex].texture;
    uniforms.uTextureB.value = textures[nextIndex].texture;
    uniforms.uTextureASize.value.copy(textures[previousIndex].size);
    uniforms.uTextureBSize.value.copy(textures[nextIndex].size);
    uniforms.uDirection.value = direction;
    uniforms.uProgress.value = 0;
    root.classList.toggle('is-webgl-ready', textures[previousIndex].valid && textures[nextIndex].valid);
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - started) / (reducedMotion ? 180 : TRANSITION_DURATION), 1);
      uniforms.uProgress.value = progress;
      if (progress < 1 && !disposed) transitionRaf = requestAnimationFrame(tick);
      else {
        activeIndex = nextIndex;
        uniforms.uTextureA.value = textures[nextIndex].texture;
        uniforms.uTextureB.value = textures[nextIndex].texture;
        uniforms.uTextureASize.value.copy(textures[nextIndex].size);
        uniforms.uTextureBSize.value.copy(textures[nextIndex].size);
        uniforms.uProgress.value = 0;
        fallback.src = projects[nextIndex].image;
        if (renderer && scene && camera) renderer.render(scene, camera);
        root.classList.toggle('is-webgl-ready', textures[nextIndex].valid);
        transitionLocked = false;
      }
    };
    transitionRaf = requestAnimationFrame(tick);
  };

  const onClick = (event: Event) => changeProject(Number((event.currentTarget as HTMLButtonElement).dataset.projectButton));
  const onKeydown = (event: KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || transitionLocked) return;
    event.preventDefault();
    let next = activeIndex;
    if (event.key === 'ArrowDown') next = (activeIndex + 1) % projects.length;
    if (event.key === 'ArrowUp') next = (activeIndex - 1 + projects.length) % projects.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = projects.length - 1;
    changeProject(next);
    buttons[next]?.focus();
  };
  const onPointer = (event: PointerEvent) => {
    if (!coarsePointer && !reducedMotion) pointerTarget.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight * 2 - 1));
  };
  buttons.forEach((button) => { button.addEventListener('click', onClick); button.addEventListener('keydown', onKeydown); });
  autoplayToggle.addEventListener('click', onAutoplayToggle);

  window.__projectShowcaseCleanup = () => {
    disposed = true;
    cancelAnimationFrame(renderRaf);
    cancelAnimationFrame(transitionRaf);
    stopAutoplay();
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onPointer);
    buttons.forEach((button) => { button.removeEventListener('click', onClick); button.removeEventListener('keydown', onKeydown); });
    autoplayToggle.removeEventListener('click', onAutoplayToggle);
    gsap.killTweensOf(root.querySelectorAll('[data-char]'));
    textures.forEach(({ texture }) => texture.dispose());
    material?.dispose(); geometry?.dispose(); renderer?.dispose(); renderer?.domElement.remove();
    root.classList.remove('is-webgl-ready');
  };

  try {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    textures = await Promise.all(projects.map((project) => loadTexture(loader, project.image)));
    if (disposed) { textures.forEach(({ texture }) => texture.dispose()); return; }
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    textures.forEach(({ texture, valid }) => { if (valid) renderer?.initTexture(texture); });
    host.appendChild(renderer.domElement);
    geometry = new THREE.PlaneGeometry(2, 2);
    material = new THREE.ShaderMaterial({ vertexShader, fragmentShader: velocityShader, uniforms: {
      uTextureA: { value: textures[0].texture }, uTextureB: { value: textures[0].texture },
      uResolution: { value: new THREE.Vector2() }, uTextureASize: { value: textures[0].size.clone() },
      uTextureBSize: { value: textures[0].size.clone() }, uMouse: { value: pointer },
      uProgress: { value: 0 }, uDirection: { value: 1 }, uReducedMotion: { value: reducedMotion ? 1 : 0 },
    } });
    scene = new THREE.Scene(); camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene.add(new THREE.Mesh(geometry, material));
    const render = () => {
      if (disposed || !renderer || !material || !scene || !camera) return;
      pointer.lerp(pointerTarget, 0.035);
      renderer.render(scene, camera);
      renderRaf = requestAnimationFrame(render);
    };
    resize(); renderer.render(scene, camera);
    root.classList.toggle('is-webgl-ready', textures[0].valid);
    buttons.forEach((button) => { button.disabled = false; });
    addEventListener('resize', resize); addEventListener('pointermove', onPointer, { passive: true });
    renderRaf = requestAnimationFrame(render);
    startAutoplay();
  } catch (error) {
    console.warn('WebGL project transition is unavailable.', error);
    buttons.forEach((button) => { button.disabled = false; });
  }
}
