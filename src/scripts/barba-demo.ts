import barba from '@barba/core';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

declare global {
  interface Window {
    __barbaDemoInitialized?: boolean;
  }
}

const DEBUG_TRANSITIONS = false;
const SHARED_IDS = ['demo-image', 'demo-title'] as const;

type SharedId = (typeof SHARED_IDS)[number];

type CloneRecord = {
  id: SharedId;
  source: HTMLElement;
  target: HTMLElement;
  clone: HTMLElement;
};

let activeTimeline: gsap.core.Timeline | null = null;
let isRunning = false;

const logDebug = (...args: unknown[]) => {
  if (DEBUG_TRANSITIONS) {
    console.info('[barba-demo]', ...args);
  }
};

const getLayer = () => document.querySelector<HTMLElement>('.shared-transition-layer');

const getSharedElement = (container: HTMLElement, id: SharedId) =>
  container.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);

const waitForFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const waitForImages = async (container: HTMLElement) => {
  const images = Array.from(container.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete) return;
      await image.decode().catch(() => undefined);
    })
  );

  logDebug('image decoding completed');
};

const copyBoxStyles = (clone: HTMLElement, source: HTMLElement) => {
  const style = window.getComputedStyle(source);
  clone.style.borderRadius = style.borderRadius;
  clone.style.overflow = style.overflow === 'visible' ? 'hidden' : style.overflow;
  clone.style.background = style.background;
};

const copyTextStyles = (clone: HTMLElement, source: HTMLElement) => {
  const style = window.getComputedStyle(source);
  const properties = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'lineHeight',
    'letterSpacing',
    'textTransform',
    'textAlign',
    'color',
    'maxWidth',
    'whiteSpace',
  ] as const;

  properties.forEach((property) => {
    clone.style[property] = style[property];
  });
};

const copyImageStyles = (clone: HTMLElement, source: HTMLElement) => {
  const sourceImage = source.querySelector('img');
  const cloneImage = clone.querySelector('img');
  if (!(sourceImage instanceof HTMLImageElement) || !(cloneImage instanceof HTMLImageElement)) return;

  const imageStyle = window.getComputedStyle(sourceImage);
  cloneImage.style.width = '100%';
  cloneImage.style.height = '100%';
  cloneImage.style.objectFit = imageStyle.objectFit;
  cloneImage.style.objectPosition = imageStyle.objectPosition;
};

const applyRect = (element: HTMLElement, rect: DOMRect) => {
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
};

const makeClone = (source: HTMLElement, id: SharedId) => {
  const clone = source.cloneNode(true) as HTMLElement;
  const rect = source.getBoundingClientRect();

  clone.removeAttribute('id');
  clone.setAttribute('data-transition-clone', id);
  clone.removeAttribute('data-flip-id');
  clone.classList.add('shared-transition-clone');
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.margin = '0';
  clone.style.pointerEvents = 'none';
  clone.style.transformOrigin = '0 0';
  clone.style.zIndex = id === 'demo-title' ? '2' : '1';
  applyRect(clone, rect);

  if (id === 'demo-image') {
    copyBoxStyles(clone, source);
    copyImageStyles(clone, source);
  } else {
    copyTextStyles(clone, source);
  }

  return clone;
};

const setElementHidden = (element: HTMLElement, hidden: boolean) => {
  element.style.visibility = hidden ? 'hidden' : '';
};

const setContainerTransitionPosition = (current: HTMLElement, next: HTMLElement) => {
  current.style.position = 'fixed';
  current.style.inset = '0';
  current.style.width = '100%';
  current.style.zIndex = '1';
  current.style.overflow = 'hidden';

  next.style.position = 'relative';
  next.style.zIndex = '2';
  next.style.minHeight = '100svh';
};

const clearContainerStyles = (...containers: HTMLElement[]) => {
  containers.forEach((container) => {
    container.style.position = '';
    container.style.inset = '';
    container.style.width = '';
    container.style.zIndex = '';
    container.style.overflow = '';
    container.style.minHeight = '';
    container.style.opacity = '';
    container.style.visibility = '';
  });
};

const focusMainHeading = (container: HTMLElement) => {
  const heading = container.querySelector<HTMLElement>('h1');
  if (!heading) return;

  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
};

const cleanupTransition = (
  records: CloneRecord[] = [],
  current?: HTMLElement,
  next?: HTMLElement,
  removeCurrent = false
) => {
  activeTimeline?.kill();
  activeTimeline = null;

  records.forEach(({ source, target, clone }) => {
    setElementHidden(source, false);
    setElementHidden(target, false);
    clone.remove();
  });

  if (current && next) {
    clearContainerStyles(current, next);
  }

  if (removeCurrent && current?.isConnected) {
    current.remove();
  }

  if (removeCurrent && next) {
    if (!next.isConnected) {
      document.querySelector('[data-barba="wrapper"]')?.append(next);
    }
    document.querySelectorAll<HTMLElement>('[data-barba="container"]').forEach((container) => {
      if (container !== next) {
        container.remove();
      }
    });
    logDebug(
      'remaining containers',
      Array.from(document.querySelectorAll<HTMLElement>('[data-barba="container"]')).map(
        (container) => container.dataset.barbaNamespace
      )
    );
    logDebug('active text', next.innerText.slice(0, 120));
  }

  document.documentElement.classList.remove('is-transitioning');
  isRunning = false;
  logDebug('cleanup complete');
};

const runReducedMotionTransition = async (current: HTMLElement, next: HTMLElement) => {
  window.scrollTo(0, 0);
  gsap.set(next, { autoAlpha: 0 });

  await gsap
    .timeline()
    .to(current, { autoAlpha: 0, duration: 0.12, ease: 'power1.out' })
    .to(next, { autoAlpha: 1, duration: 0.16, ease: 'power1.out' }, 0)
    .then();

  gsap.set([current, next], { clearProps: 'opacity,visibility' });
};

const runSharedTransition = async (data: barba.HookData) => {
  const current = data.current.container as HTMLElement;
  const next = data.next.container as HTMLElement;
  const layer = getLayer();

  if (!layer || !current || !next) return;
  if (isRunning) return;

  isRunning = true;
  document.documentElement.classList.add('is-transitioning');
  activeTimeline?.kill();

  logDebug('transition start', data.current.namespace, data.next.namespace);

  await document.fonts.ready;
  await waitForImages(current);
  await waitForImages(next);
  await waitForFrame();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await runReducedMotionTransition(current, next);
    if (current.isConnected) current.remove();
    document.documentElement.classList.remove('is-transitioning');
    isRunning = false;
    focusMainHeading(next);
    return;
  }

  const records: CloneRecord[] = [];

  try {
    setContainerTransitionPosition(current, next);

    SHARED_IDS.forEach((id) => {
      const source = getSharedElement(current, id);
      const target = getSharedElement(next, id);

      if (!source || !target) {
        throw new Error(`Missing shared element: ${id}`);
      }

      const clone = makeClone(source, id);
      layer.append(clone);
      setElementHidden(source, true);
      setElementHidden(target, true);
      records.push({ id, source, target, clone });

      logDebug(id, {
        source: source.getBoundingClientRect(),
        target: target.getBoundingClientRect(),
      });
    });

    window.scrollTo(0, 0);
    await waitForFrame();

    activeTimeline = gsap.timeline({
      paused: true,
      defaults: {
        duration: 1.1,
        ease: 'power3.inOut',
      },
    });

    gsap.set(next, { autoAlpha: 0 });
    gsap.set(next.querySelectorAll('[data-page-reveal]'), { autoAlpha: 0, y: 24 });

    records.forEach(({ clone, target }, index) => {
      const state = Flip.getState(clone);
      applyRect(clone, target.getBoundingClientRect());

      activeTimeline?.add(
        Flip.from(state, {
          duration: 1.1,
          ease: 'power3.inOut',
          absolute: true,
          scale: true,
          prune: true,
        }),
        index === 0 ? 0 : 0.03
      );
    });

    activeTimeline
      .fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, 0)
      .fromTo(
        next.querySelectorAll('[data-page-reveal]'),
        { y: 24, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.06,
          ease: 'power2.out',
        },
        0.35
      );

    await new Promise<void>((resolve) => {
      activeTimeline?.eventCallback('onComplete', () => {
        records.forEach(({ target }) => setElementHidden(target, false));
        resolve();
      });
      activeTimeline?.play(0);
    });

    cleanupTransition(records, current, next, true);
    focusMainHeading(next);
    logDebug('transition complete');
  } catch (error) {
    console.warn('[barba-demo] Falling back after transition error:', error);
    cleanupTransition(records, current, next);
  }
};

const initBarbaDemo = () => {
  barba.init({
    preventRunning: true,
    timeout: 7000,
    transitions: [
      {
        name: 'barba-shared-element-demo',
        sync: true,
        from: {
          namespace: ['demo-a', 'demo-b'],
        },
        to: {
          namespace: ['demo-a', 'demo-b'],
        },
        leave() {
          return undefined;
        },
        async enter(data) {
          await runSharedTransition(data);
        },
      },
    ],
  });
};

if (!window.__barbaDemoInitialized) {
  window.__barbaDemoInitialized = true;
  initBarbaDemo();
}
