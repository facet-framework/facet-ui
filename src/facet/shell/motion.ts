/**
 * Whether motion is reduced right now: the browser asks for it
 * (`prefers-reduced-motion`), or the app set the shell to reduced
 * (`AppShell reducedMotion`). Code that scrolls or animates from script reads
 * this; CSS reads the same two sources on its own.
 */
export function reducedMotion(): boolean {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    return document.querySelector('[data-motion="reduced"]') != null;
  } catch {
    return false;
  }
}
