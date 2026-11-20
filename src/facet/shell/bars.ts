import { useLayoutEffect, type RefObject } from "react";

/**
 * The height of a bar that sits fixed or sticky at the top, written as a CSS
 * custom property onto a host element, so that everything below the bar can
 * derive its offset from the real height rather than from a token.
 *
 * The tokens `--t-head-h` and `--t-nav-h` name the rows the bars are built
 * from, not the bars: the borders add two pixels, the phone head has its own
 * height and no nav, and a strip pinned under the bars grows with every row
 * it holds. A sticky side rail at `top: 16px` and a section at
 * `scroll-margin-top: 16px` therefore landed behind the bars.
 *
 * An absent bar writes `0px`, so a sum of several bars stays valid when one
 * of them is not drawn.
 */
export function writeHeight(name: `--${string}`, bar: Element | null, host: HTMLElement | null) {
  if (!host) return;
  const height = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0;
  host.style.setProperty(name, `${height}px`);
}

/**
 * Keeps `name` on `host` at the height of `bar` while the bar is drawn, by a
 * ResizeObserver. `drawn` changes whenever the bar is mounted or unmounted,
 * so that the observer follows the element that is there.
 */
export function useHeightVar(
  name: `--${string}`,
  bar: RefObject<Element | null>,
  host: RefObject<HTMLElement | null>,
  drawn: unknown,
) {
  useLayoutEffect(() => {
    const b = bar.current;
    const h = host.current;
    writeHeight(name, b, h);
    if (!b || !h || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => writeHeight(name, b, h));
    observer.observe(b);
    return () => observer.disconnect();
  }, [name, bar, host, drawn]);
}
