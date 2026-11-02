export const pageTransition = {
  /** Codrops Interlude Wipe defaults. Durations are in seconds. */
  wipeDuration: 0.9,
  revealDuration: 0.9,
  wipeEase: 'power2.inOut',
  revealEase: 'power2.out',
  overlayColor: '#34352d',
  pageOffset: 80,
  /** The reference moves right-to-left; this site requirement uses left-to-right. */
  forwardDirection: 'left-to-right' as 'left-to-right' | 'right-to-left',
  mediaTimeout: 1500,
} as const;
