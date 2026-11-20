import { act, render, screen } from "@testing-library/react";
import { AppShell } from "./Shell";

/*
 * jsdom lays nothing out: every box is 0 high and no ResizeObserver exists.
 * These cases give the measured boxes a height and hold the observers, so
 * that what the page writes can be read where it lands, on the elements the
 * CSS reads it from.
 */
let heights: Map<string, number>;
let observers: { cb: ResizeObserverCallback; el?: Element }[];
const realRect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  heights = new Map();
  observers = [];
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const height = heights.get(this.getAttribute("data-testid") ?? "") ?? 0;
    return { top: 0, bottom: height, left: 0, right: 0, width: 0, height } as DOMRect;
  };
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    entry: { cb: ResizeObserverCallback; el?: Element };
    constructor(cb: ResizeObserverCallback) {
      this.entry = { cb };
      observers.push(this.entry);
    }
    observe(el: Element) {
      this.entry.el = el;
    }
    disconnect() {
      observers.splice(observers.indexOf(this.entry), 1);
    }
  };
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect;
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});

const resize = () =>
  act(() => {
    for (const o of [...observers]) o.cb([], {} as ResizeObserver);
  });

describe("the bars' height", () => {
  it("is written onto the shell from the measured head, and follows it", () => {
    heights.set("shell-head", 119);
    render(
      <AppShell top={<header>top</header>} nav={<nav aria-label="Areas">nav</nav>}>
        <p>page</p>
      </AppShell>,
    );
    const shell = screen.getByTestId("app-shell");
    expect(shell.style.getPropertyValue("--t-bars-h")).toBe("119px");
    // The head wraps to a second line: the observer reports, the value follows.
    heights.set("shell-head", 171);
    resize();
    expect(shell.style.getPropertyValue("--t-bars-h")).toBe("171px");
  });
});
