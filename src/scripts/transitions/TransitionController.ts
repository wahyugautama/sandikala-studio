import { gsap } from 'gsap';
import { WebGPUScene, type PlaneBounds } from './WebGPUScene';

type TransitionDirection = 'forward' | 'back';

type TransitionContext = {
  fromPageType: string;
  toPageType: string;
  selectedImageId: string | null;
  direction: TransitionDirection;
};

const DEBUG_TRANSITIONS = false;

const isModifiedClick = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

const isSameOriginRoute = (href: string) => {
  const url = new URL(href, window.location.href);
  return url.origin === window.location.origin;
};

const isHashOnly = (href: string) => {
  const url = new URL(href, window.location.href);
  return (
    url.origin === window.location.origin &&
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    url.hash.length > 0
  );
};

const waitFrames = (count = 2) =>
  new Promise<void>((resolve) => {
    const tick = () => {
      count -= 1;
      if (count <= 0) {
        resolve();
      } else {
        window.requestAnimationFrame(tick);
      }
    };
    window.requestAnimationFrame(tick);
  });

const copyDocumentMeta = (doc: Document) => {
  const nextTitle = doc.querySelector('title')?.textContent;
  if (nextTitle) {
    document.title = nextTitle;
  }

  const currentDescription = document.querySelector('meta[name="description"]');
  const nextDescription = doc.querySelector('meta[name="description"]');
  if (currentDescription && nextDescription) {
    currentDescription.setAttribute('content', nextDescription.getAttribute('content') || '');
  }
};

export class TransitionController {
  private scene: WebGPUScene;
  private isLocked = false;
  private supportsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private cleanupCallbacks: Array<() => void> = [];

  constructor(scene: WebGPUScene) {
    this.scene = scene;
  }

  start() {
    this.scene.syncSlots();
    document.addEventListener('click', this.onClick);
    window.addEventListener('popstate', this.onPopState);
    window.addEventListener('resize', this.scene.resize);
    document.addEventListener('astro:page-load', this.onPageLoad);
    this.cleanupCallbacks.push(() => {
      document.removeEventListener('click', this.onClick);
      window.removeEventListener('popstate', this.onPopState);
      window.removeEventListener('resize', this.scene.resize);
      document.removeEventListener('astro:page-load', this.onPageLoad);
    });
  }

  destroy() {
    this.cleanupCallbacks.forEach((cleanup) => cleanup());
    this.cleanupCallbacks = [];
  }

  private onPageLoad = () => {
    this.scene.syncSlots();
  };

  private onClick = (event: MouseEvent) => {
    if (isModifiedClick(event)) return;

    const target = event.target instanceof Element ? event.target.closest('a[data-transition-link]') : null;
    if (!(target instanceof HTMLAnchorElement)) return;
    if (target.target === '_blank' || target.hasAttribute('download')) return;
    if (target.href.startsWith('mailto:') || target.href.startsWith('tel:')) return;
    if (!isSameOriginRoute(target.href) || isHashOnly(target.href)) return;

    event.preventDefault();
    const selectedImageId = target.dataset.projectId || target.dataset.imageId || this.getCurrentHeroImageId();
    this.navigate(target.href, selectedImageId, 'forward');
  };

  private onPopState = () => {
    this.navigate(window.location.href, this.getCurrentHeroImageId(), 'back', false);
  };

  private getCurrentHeroImageId() {
    return document.querySelector<HTMLElement>('[data-gpu-slot][data-slot-role="hero"]')?.dataset.imageId || null;
  }

  private canUseSharedTransition(context: TransitionContext) {
    if (!this.scene.isReady || !this.supportsMotion) return false;
    if (!context.selectedImageId) return false;
    const pair = `${context.fromPageType}->${context.toPageType}`;
    return (
      pair === 'work-index->work-detail' ||
      pair === 'work-detail->work-index' ||
      pair === 'work-detail->work-detail'
    );
  }

  private async navigate(href: string, selectedImageId: string | null, direction: TransitionDirection, push = true) {
    if (this.isLocked) return;
    this.isLocked = true;

    const fromMain = document.querySelector('main');
    if (!(fromMain instanceof HTMLElement)) {
      window.location.href = href;
      return;
    }

    fromMain.setAttribute('aria-busy', 'true');

    try {
      await this.scene.syncSlots();
      const response = await fetch(href, { headers: { 'X-Transition-Navigation': '1' } });
      if (!response.ok) {
        window.location.href = href;
        return;
      }

      const html = await response.text();
      const nextDocument = new DOMParser().parseFromString(html, 'text/html');
      const nextMain = nextDocument.querySelector('main');
      if (!(nextMain instanceof HTMLElement)) {
        window.location.href = href;
        return;
      }

      const context: TransitionContext = {
        fromPageType: fromMain.dataset.pageType || 'default',
        toPageType: nextMain.dataset.pageType || 'default',
        selectedImageId,
        direction,
      };

      if (DEBUG_TRANSITIONS) {
        console.info('[transitions]', context);
      }

      if (!this.canUseSharedTransition(context)) {
        await this.runFallbackSwap(fromMain, nextMain, nextDocument, href, push);
        return;
      }

      await this.runSharedImageTransition(fromMain, nextMain, nextDocument, href, push, context);
    } catch (error) {
      console.warn('[transitions] Falling back to normal navigation:', error);
      window.location.href = href;
    } finally {
      const main = document.querySelector('main');
      main?.removeAttribute('aria-busy');
      this.isLocked = false;
    }
  }

  private async runFallbackSwap(
    fromMain: HTMLElement,
    nextMain: HTMLElement,
    nextDocument: Document,
    href: string,
    push: boolean
  ) {
    await gsap.to(fromMain, { opacity: 0, duration: this.supportsMotion ? 0.22 : 0.01, ease: 'power2.out' });
    this.swapMain(fromMain, nextMain, nextDocument, href, push);
    const currentMain = document.querySelector('main');
    if (currentMain instanceof HTMLElement) {
      currentMain.style.opacity = '0';
      await waitFrames(1);
      await gsap.to(currentMain, { opacity: 1, duration: this.supportsMotion ? 0.28 : 0.01, ease: 'power2.out' });
      currentMain.style.opacity = '';
    }
  }

  private async runSharedImageTransition(
    fromMain: HTMLElement,
    nextMain: HTMLElement,
    nextDocument: Document,
    href: string,
    push: boolean,
    context: TransitionContext
  ) {
    const staging = document.createElement('div');
    staging.className = 'transition-staging';
    staging.setAttribute('aria-hidden', 'true');
    staging.append(nextMain.cloneNode(true));
    document.body.append(staging);
    await waitFrames(2);
    await document.fonts?.ready;

    const selectedPlane = this.scene.getPlane(context.selectedImageId);
    const targetSlot = staging.querySelector<HTMLElement>(
      `[data-gpu-slot][data-image-id="${CSS.escape(context.selectedImageId || '')}"]`
    );

    if (!selectedPlane || !targetSlot) {
      staging.remove();
      await this.runFallbackSwap(fromMain, nextMain, nextDocument, href, push);
      return;
    }

    const targetBounds = this.scene.getBounds(targetSlot);
    const outgoingContent = Array.from(fromMain.children).filter(
      (child) => !(child instanceof HTMLElement && child.matches('[data-gpu-slot], .gpu-image-slot'))
    );

    this.scene.isTransitioning = true;
    this.scene.detachAll();

    const fadeOutTweens = Array.from(this.scene.planes.values())
      .filter((plane) => plane.id !== context.selectedImageId)
      .map((plane) =>
        gsap.to(plane, {
          opacity: 0,
          scale: 0.96,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: true,
        })
      );

    await Promise.all([
      gsap.to(selectedPlane.bounds, {
        ...targetBounds,
        duration: 1.1,
        ease: 'power3.inOut',
        overwrite: true,
      }),
      gsap.to(selectedPlane, {
        opacity: 1,
        scale: 1,
        duration: 1.1,
        ease: 'power3.inOut',
        overwrite: true,
      }),
      gsap.to(outgoingContent, {
        opacity: 0,
        y: -20,
        duration: 0.38,
        ease: 'power2.out',
        stagger: 0.025,
      }),
      ...fadeOutTweens,
    ]);

    staging.remove();
    this.swapMain(fromMain, nextMain, nextDocument, href, push);
    await waitFrames(2);

    const currentMain = document.querySelector('main');
    if (currentMain instanceof HTMLElement) {
      const incoming = Array.from(currentMain.children);
      gsap.fromTo(
        incoming,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.58, ease: 'power3.out', stagger: 0.035 }
      );
    }

    await this.scene.syncSlots();
    this.scene.isTransitioning = false;
  }

  private swapMain(
    fromMain: HTMLElement,
    nextMain: HTMLElement,
    nextDocument: Document,
    href: string,
    push: boolean
  ) {
    copyDocumentMeta(nextDocument);
    fromMain.replaceWith(nextMain);
    if (push) {
      window.history.pushState({}, '', href);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.dispatchEvent(new Event('astro:page-load'));

    const primaryHeading = nextMain.querySelector('h1');
    const focusTarget = primaryHeading instanceof HTMLElement ? primaryHeading : nextMain;
    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  }
}
