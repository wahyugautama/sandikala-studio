import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import type {
  TransitionBeforePreparationEvent,
  TransitionBeforeSwapEvent,
} from 'astro:transitions/client';
import { pageTransition as config } from '../config/page-transition';

gsap.registerPlugin(ScrollTrigger);

type Direction = 1 | -1;
type WipeState = 'idle' | 'leaving' | 'covered' | 'entering';

const SCROLL_KEYS = new Set([
  ' ',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

const waitForMedia = async (root: HTMLElement, timeout: number) => {
  const images = [...root.querySelectorAll<HTMLImageElement>('img')]
    .filter(
      (image) =>
        !image.loading ||
        image.loading === 'eager' ||
        image.getBoundingClientRect().top < innerHeight * 1.25,
    )
    .map((image) => image.decode?.().catch(() => undefined));
  const ready = Promise.all([document.fonts?.ready, ...images]);
  const limit = new Promise<void>((resolve) =>
    window.setTimeout(resolve, timeout),
  );
  await Promise.race([ready, limit]);
};

class PageTransitionController {
  private root: HTMLElement;
  private panel: HTMLElement;
  private state: WipeState = 'idle';
  private direction: Direction = 1;
  private navigationDirection: 'forward' | 'back' = 'forward';
  private timeline?: gsap.core.Timeline;
  private run = 0;
  private reducedMotion = false;
  private locked = new Set<HTMLElement>();
  private listeners = new AbortController();

  constructor(root: HTMLElement, panel: HTMLElement) {
    this.root = root;
    this.panel = panel;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = motion.matches;
    motion.addEventListener('change', this.handleMotionChange, {
      signal: this.listeners.signal,
    });

    const signal = this.listeners.signal;
    document.addEventListener(
      'astro:before-preparation',
      this.handleBeforePreparation,
      { signal },
    );
    document.addEventListener('astro:before-swap', this.handleBeforeSwap, {
      signal,
    });
    document.addEventListener('astro:after-swap', this.handleAfterSwap, {
      signal,
    });
    document.addEventListener('astro:page-load', this.handlePageLoad, {
      signal,
    });
    window.addEventListener('wheel', this.holdScroll, {
      signal,
      passive: false,
    });
    window.addEventListener('touchmove', this.holdScroll, {
      signal,
      passive: false,
    });
    window.addEventListener('keydown', this.holdScroll, { signal });

    gsap.set(this.panel, { xPercent: 100 });
  }

  private get content() {
    return document.querySelector<HTMLElement>('.page-transition-content');
  }

  private setState(state: WipeState) {
    this.state = state;
    this.root.dataset.state = state;
  }

  private emit(name: 'leave' | 'covered' | 'enter' | 'idle') {
    document.dispatchEvent(
      new CustomEvent(`page-transition:${name}`, {
        detail: { direction: this.navigationDirection },
      }),
    );
  }

  private lock() {
    document.documentElement.classList.add('is-page-transitioning');
    [...document.body.children].forEach((element) => {
      if (
        !(element instanceof HTMLElement) ||
        element === this.root ||
        element.inert
      )
        return;
      element.inert = true;
      this.locked.add(element);
    });
  }

  private unlock() {
    this.locked.forEach((element) => {
      element.inert = false;
    });
    this.locked.clear();
    document.documentElement.classList.remove('is-page-transitioning');
  }

  private holdScroll = (event: Event) => {
    if (this.state === 'idle') return;
    if (event instanceof KeyboardEvent) {
      if (
        !SCROLL_KEYS.has(event.key) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
    }
    event.preventDefault();
  };

  private stopAnimation() {
    this.timeline?.kill();
    this.timeline = undefined;
  }

  private leave = () =>
    new Promise<void>((resolve) => {
      this.stopAnimation();
      this.setState('leaving');
      this.emit('leave');
      this.lock();

      const content = this.content;
      gsap.set(this.panel, { xPercent: 100 * this.direction });
      this.timeline = gsap.timeline({
        defaults: { duration: config.wipeDuration, ease: config.wipeEase },
        onComplete: () => {
          this.timeline = undefined;
          this.setState('covered');
          this.emit('covered');
          resolve();
        },
        onInterrupt: resolve,
      });
      this.timeline.to(this.panel, { xPercent: 0 });
      if (content) {
        this.timeline.to(
          content,
          {
            x: -config.pageOffset * this.direction,
            opacity: 0,
            force3D: true,
          },
          0,
        );
      }
    });

  private enter = () =>
    new Promise<void>((resolve) => {
      this.stopAnimation();
      const content = this.content;
      this.setState('entering');
      this.emit('enter');

      this.timeline = gsap.timeline({
        defaults: { duration: config.revealDuration, ease: config.revealEase },
        onComplete: () => {
          this.timeline = undefined;
          gsap.set(this.panel, { xPercent: 100 * this.direction });
          if (content)
            gsap.set(content, { clearProps: 'transform,opacity,willChange' });
          this.setState('idle');
          this.unlock();
          ScrollTrigger.refresh();
          document
            .querySelector<HTMLElement>('main')
            ?.focus({ preventScroll: true });
          this.emit('idle');
          resolve();
        },
        onInterrupt: resolve,
      });
      this.timeline.to(this.panel, { xPercent: -100 * this.direction });
      if (content) {
        this.timeline.to(
          content,
          {
            x: 0,
            opacity: 1,
            force3D: true,
            clearProps: 'transform,opacity,willChange',
          },
          0,
        );
      }
    });

  private handleBeforePreparation = (
    event: TransitionBeforePreparationEvent,
  ) => {
    const currentRun = ++this.run;
    this.navigationDirection = event.direction === 'back' ? 'back' : 'forward';
    const forwardSign = config.forwardDirection === 'left-to-right' ? -1 : 1;
    this.direction =
      this.navigationDirection === 'back'
        ? (-forwardSign as Direction)
        : forwardSign;

    if (this.reducedMotion) {
      this.stopAnimation();
      this.unlock();
      this.setState('idle');
      return;
    }

    const load = event.loader;
    event.loader = async () => {
      try {
        await Promise.all([load(), this.leave()]);
      } catch (error) {
        if (currentRun === this.run && this.state !== 'idle')
          await this.enter();
        throw error;
      }
    };
  };

  private handleBeforeSwap = (event: TransitionBeforeSwapEvent) => {
    event.viewTransition?.ready.catch(() => undefined);
    event.viewTransition?.skipTransition();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };

  private handleAfterSwap = () => {
    if (this.reducedMotion || this.state === 'idle') return;
    this.locked.clear();
    this.lock();
    const content = this.content;
    if (content) {
      gsap.set(content, {
        x: config.pageOffset * this.direction,
        opacity: 0,
        willChange: 'transform,opacity',
        force3D: true,
      });
    }
  };

  private handlePageLoad = async () => {
    if (this.reducedMotion || this.state !== 'covered') return;
    const currentRun = this.run;
    const content = this.content;
    if (content) await waitForMedia(content, config.mediaTimeout);
    if (currentRun === this.run && this.state === 'covered') await this.enter();
  };

  private handleMotionChange = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches;
    if (!event.matches) return;
    this.run++;
    this.stopAnimation();
    gsap.set([this.panel, this.content].filter(Boolean), {
      clearProps: 'transform,opacity,willChange',
    });
    this.setState('idle');
    this.unlock();
  };
}

declare global {
  interface Window {
    __sandikalaPageTransition?: PageTransitionController;
  }
}

export const startPageTransition = () => {
  if (window.__sandikalaPageTransition) return;
  const root = document.querySelector<HTMLElement>('[data-page-wipe]');
  const panel = root?.querySelector<HTMLElement>('[data-page-wipe-panel]');
  if (!root || !panel) return;
  window.__sandikalaPageTransition = new PageTransitionController(root, panel);
};
