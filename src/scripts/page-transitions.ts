import barba from '@barba/core';
import gsap from 'gsap';
import { createContactTransition } from './transitions/contact-transition';

declare global {
  interface Window {
    __sandikalaBarbaInitialized?: boolean;
  }
}

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

const getPathname = (url?: string) => {
  if (!url) {
    return window.location.pathname;
  }

  return new URL(url, window.location.href).pathname;
};

const isPreventedLink = (element: Element | null) => {
  const link = element?.closest('a');
  if (!(link instanceof HTMLAnchorElement)) {
    return false;
  }

  return (
    link.dataset.barbaPrevent !== undefined ||
    link.hasAttribute('download') ||
    link.target === '_blank' ||
    link.href.startsWith('mailto:') ||
    link.href.startsWith('tel:') ||
    (link.hash.length > 0 && link.pathname === window.location.pathname)
  );
};

const updateDocumentMeta = (nextHtml?: string) => {
  if (!nextHtml) {
    return;
  }

  const nextDocument = new DOMParser().parseFromString(nextHtml, 'text/html');
  const nextTitle = nextDocument.querySelector('title')?.textContent;
  if (nextTitle) {
    document.title = nextTitle;
  }

  const currentDescription = document.querySelector('meta[name="description"]');
  const nextDescription = nextDocument.querySelector('meta[name="description"]');
  if (currentDescription && nextDescription) {
    currentDescription.setAttribute('content', nextDescription.getAttribute('content') || '');
  }
};

const updateActiveNavigation = () => {
  const pathname = window.location.pathname;

  document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
    const linkPath = getPathname(link.href);
    const isActive =
      linkPath === '/'
        ? pathname === '/'
        : linkPath === '/works'
          ? pathname.startsWith('/works') || pathname.startsWith('/work')
          : pathname === linkPath;

    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const runContainerScripts = async (container: HTMLElement) => {
  const scripts = Array.from(container.querySelectorAll('script'));

  for (const script of scripts) {
    const nextScript = document.createElement('script');

    for (const attribute of script.attributes) {
      nextScript.setAttribute(attribute.name, attribute.value);
    }

    nextScript.textContent = script.textContent;

    const loadPromise = nextScript.src
      ? new Promise<void>((resolve) => {
          nextScript.addEventListener('load', () => resolve(), { once: true });
          nextScript.addEventListener('error', () => resolve(), { once: true });
        })
      : Promise.resolve();

    script.replaceWith(nextScript);
    await loadPromise;
  }
};

export const destroyPage = (container?: HTMLElement | null) => {
  if (!container) {
    return;
  }

  document.dispatchEvent(new Event('astro:before-swap'));
  gsap.killTweensOf(container);
};

export const initPage = (container?: HTMLElement | null) => {
  if (!container) {
    return;
  }

  document.dispatchEvent(new Event('astro:page-load'));
  updateActiveNavigation();
  requestAnimationFrame(() => {
    const focusTarget = container.querySelector<HTMLElement>('h1') || container;
    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  });
};

const initBarba = () => {
  if (window.__sandikalaBarbaInitialized) {
    return;
  }

  const wrapper = document.querySelector('[data-barba="wrapper"]');
  const container = document.querySelector('[data-barba="container"]');
  if (!wrapper || !container) {
    return;
  }

  window.__sandikalaBarbaInitialized = true;

  barba.hooks.before((data) => {
    updateDocumentMeta(data.next.html);
  });

  barba.hooks.beforeLeave((data) => {
    document.body.classList.add('is-transitioning');
    destroyPage(data.current.container as HTMLElement);
  });

  barba.hooks.afterEnter(async (data) => {
    resetScroll();
    await runContainerScripts(data.next.container as HTMLElement);
    initPage(data.next.container as HTMLElement);
  });

  barba.hooks.after(() => {
    document.body.classList.remove('is-transitioning');
    document.body.style.overflow = '';
    resetScroll();
  });

  barba.init({
    preventRunning: true,
    timeout: 7000,
    prevent: ({ el, event }) => {
      if (event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
        return true;
      }

      return isPreventedLink(el);
    },
    transitions: [createContactTransition()],
  });

  resetScroll();
  initPage(container as HTMLElement);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBarba, { once: true });
} else {
  initBarba();
}
