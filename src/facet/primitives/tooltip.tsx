import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

/**
 * One tooltip for every `title` inside the app, and one a keyboard can reach.
 *
 * The browser's own tooltip appears after a second or two, in a font nobody
 * chose, and never on keyboard focus: a reader who tabs to an icon button gets
 * no explanation at all. This layer replaces it. It shows after 350 ms on
 * hover and at once on keyboard focus, in the app's own type, placed inside
 * the window, and goes away on Escape.
 *
 * It is mounted once (the AppShell does) and listens on the document rather
 * than being wrapped around each control: every `title` in the tree — an
 * IconButton's label included — gets it without its author knowing this
 * exists. The `title` is moved to `data-tip` when a control is first armed;
 * that is what keeps the browser's own tooltip from appearing beside it.
 */

/** What the anchor occupies on screen. */
export type TipBox = { left: number; top: number; width: number; height: number };

/** Where the tooltip ends up, and which way its arrow points. */
export type TipPlacement = {
  left: number;
  top: number;
  /** "top" means above the anchor; the arrow then points down. */
  pos: "top" | "bottom";
  /** Where the arrow sits along the tooltip's own width. */
  arrow: number;
};

/** The gap between anchor and tooltip. */
const GAP = 8;
/** How close to a window edge the tooltip may come. */
const EDGE = 6;
/** How close to the tooltip's own corner the arrow may come. */
const ARROW_INSET = 10;

/**
 * Centred above the anchor, flipped below when there is no room above, and
 * never past a window edge.
 *
 * The arrow is computed after the clamping, not before: once the tooltip has
 * been pushed sideways to stay on screen, an arrow at its own centre points at
 * empty space. It stays with the anchor instead, which is what makes a clamped
 * tooltip still say what it belongs to.
 */
export function placeTooltip(
  anchor: TipBox,
  tip: { width: number; height: number },
  view: { width: number; height?: number },
): TipPlacement {
  const roomAbove = anchor.top - tip.height - GAP >= EDGE;
  const pos: "top" | "bottom" = roomAbove ? "top" : "bottom";
  const top = pos === "top" ? anchor.top - tip.height - GAP : anchor.top + anchor.height + GAP;

  const centred = anchor.left + anchor.width / 2 - tip.width / 2;
  const left = Math.max(EDGE, Math.min(centred, view.width - tip.width - EDGE));

  const arrowAt = anchor.left + anchor.width / 2 - left;
  const arrow = Math.max(ARROW_INSET, Math.min(tip.width - ARROW_INSET, arrowAt));

  return { left: Math.round(left), top: Math.round(top), pos, arrow: Math.round(arrow) };
}

/**
 * How long to wait before showing. Nothing for the keyboard: a reader who
 * tabbed to a control asked for it. A mouse waits, so that crossing the screen
 * does not light up every control on the way.
 */
export function tooltipDelay(byKeyboard: boolean): number {
  return byKeyboard ? 0 : 350;
}

type Shown = {
  text: string;
  place: TipPlacement;
  /**
   * False while the tooltip is only on screen to be measured. It has to exist
   * before it can be sized and be sized before it can be placed; during that
   * time it is hidden from sight AND from the accessibility tree, or the text
   * would be announced during the very delay that keeps it from showing.
   */
  ready: boolean;
};

const OFFSCREEN: TipPlacement = { left: -9999, top: -9999, pos: "top", arrow: 0 };

/**
 * Reads the text and takes the `title` away. "" for a node that has neither,
 * which tells a click on empty space from a control with nothing to say.
 */
function claim(node: HTMLElement): string {
  const title = node.getAttribute("title");
  if (title !== null) {
    node.dataset.tip = title;
    node.removeAttribute("title");
  }
  return node.dataset.tip ?? "";
}

function anchorOf(event: Event): HTMLElement | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[title],[data-tip]");
}

function byKeyboard(node: HTMLElement): boolean {
  try {
    return node.matches(":focus-visible");
  } catch {
    // An engine without :focus-visible: focus that is not a click counts as the keyboard's.
    return true;
  }
}

/**
 * The document's tooltip. Render it once, near the root.
 *
 * A control whose tooltip only repeats its accessible name (an IconButton's
 * label) is not pointed at it through `aria-describedby`: a screen reader
 * would read the same words twice. Any other tooltip describes its control.
 */
// @facet: interface/overlays/tooltips
// @facet-role: primary
export function TooltipLayer() {
  const id = `t-tip-${useId().replace(/:/g, "")}`;
  const [shown, setShown] = useState<Shown | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);
  const anchor = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    };
    const hide = () => {
      clear();
      const node = anchor.current;
      if (node?.getAttribute("aria-describedby") === id) node.removeAttribute("aria-describedby");
      anchor.current = null;
      setShown(null);
    };

    const arm = (node: HTMLElement, keyboard: boolean) => {
      const text = claim(node);
      if (!text) return;
      clear();
      anchor.current = node;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        const tip = tipRef.current;
        const box = node.getBoundingClientRect();
        // Measured from the rendered tooltip, which is why the text is put in
        // before the position: a guessed size lands beside the control.
        const size = tip
          ? { width: tip.offsetWidth, height: tip.offsetHeight }
          : { width: 0, height: 0 };
        const name = node.getAttribute("aria-label");
        if (name !== text && !node.hasAttribute("aria-describedby"))
          node.setAttribute("aria-describedby", id);
        setShown({
          text,
          ready: true,
          place: placeTooltip(
            { left: box.left, top: box.top, width: box.width, height: box.height },
            size,
            { width: window.innerWidth, height: window.innerHeight },
          ),
        });
      }, tooltipDelay(keyboard));
      // Drawn once, unready, so it can be measured; placed when the delay is over.
      setShown({ text, ready: false, place: OFFSCREEN });
    };

    const onOver = (event: MouseEvent) => {
      const node = anchorOf(event);
      if (!node || node === anchor.current) return;
      hide();
      arm(node, false);
    };
    const onOut = (event: MouseEvent) => {
      const node = anchorOf(event);
      if (node && node === anchor.current && !node.contains(event.relatedTarget as Node | null))
        hide();
    };
    const onFocus = (event: FocusEvent) => {
      const node = anchorOf(event);
      if (!node) return;
      hide();
      // Only for the keyboard: a click focuses too, and a tooltip on every
      // click would cover the thing just pressed.
      if (byKeyboard(node)) arm(node, true);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && anchor.current) hide();
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", hide);
    document.addEventListener("mousedown", hide);
    document.addEventListener("keydown", onKey);
    // Capture, because the box that scrolls is usually not the document.
    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      clear();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("mousedown", hide);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [id]);

  if (!shown) return null;
  return (
    <div
      id={id}
      ref={tipRef}
      className="t-tooltip t-tooltip--layer"
      role="tooltip"
      aria-hidden={!shown.ready || undefined}
      data-ready={shown.ready ? "yes" : "no"}
      data-pos={shown.place.pos}
      style={
        {
          left: shown.place.left,
          top: shown.place.top,
          visibility: shown.ready ? undefined : "hidden",
          "--t-tip-arrow": `${shown.place.arrow}px`,
        } as CSSProperties
      }
    >
      {shown.text}
    </div>
  );
}
