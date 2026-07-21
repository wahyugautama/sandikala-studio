import type barba from '@barba/core';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

if (!gsap.parseEase('hop')) {
  CustomEase.create('hop', '0.56, 0, 0.35, 0.98');
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const resetScroll = () => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    window.scrollTo(0, 0);
  }

  document.documentElement.scrollTop = 0;
  if (document.body) {
    document.body.scrollTop = 0;
  }
};

const cleanupContactContainer = (container: HTMLElement) => {
  container.classList.remove('contact-transition');
  container.classList.remove('contact__transition');
  gsap.set(container, {
    clearProps: 'position,inset,width,height,overflow,zIndex,clipPath,willChange',
  });
  container.style.removeProperty('--contact-overlay-clip');
};

export const createContactTransition = (): barba.Transition => ({
  name: 'example-6-transition',
  to: {
    namespace: ['contact'],
  },
  sync: true,
  before(data) {
    document.body.classList.add('is-transitioning');
    document.body.style.overflow = 'hidden';
    resetScroll();

    const next = data.next.container as HTMLElement;
    next.classList.add('contact-transition');
    next.classList.add('contact__transition');

    gsap.set(next, {
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100svh',
      minHeight: '100dvh',
      overflow: 'hidden',
      zIndex: 100,
      clipPath: 'polygon(15% 75%, 85% 75%, 85% 75%, 15% 75%)',
      willChange: 'clip-path',
      '--contact-overlay-clip': 'inset(0 0 0% 0)',
    });
  },
  enter(data) {
    const next = data.next.container as HTMLElement;

    if (reduceMotion()) {
      return gsap.fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, ease: 'none' });
    }

    const timeline = gsap.timeline({
      defaults: {
        duration: 1.25,
        ease: 'hop',
      },
      onComplete: () => {
        timeline.kill();
      },
    });

    timeline.to(next, {
      clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)',
    });

    timeline.to(
      next,
      {
        '--contact-overlay-clip': 'inset(0 0 100% 0)',
      },
      '<+=0.285'
    );

    return timeline;
  },
  after(data) {
    cleanupContactContainer(data.next.container as HTMLElement);
    document.body.classList.remove('is-transitioning');
    document.body.style.overflow = '';
    resetScroll();
  },
});
