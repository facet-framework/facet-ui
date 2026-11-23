import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefCallback,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

/** Elements that take focus with Tab; disabled and hidden ones are left out. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** The focusable elements inside a container, in document order. */
export function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[hidden],[inert]"),
  );
}

/**
 * Where the focus goes when an overlay opens and nothing inside holds it yet: an element
 * marked `data-autofocus`, else the first control, else the overlay itself.
 */
export function initialFocus(container: HTMLElement): HTMLElement {
  return (
    container.querySelector<HTMLElement>("[data-autofocus]") ??
    focusableIn(container)[0] ??
    container
  );
}

/** Attribute of the one overlay host inside a palette root. */
export const OVERLAY_HOST_ATTRIBUTE = "data-t-overlay-host";

/**
 * The overlay host for an element: a direct child of the nearest palette root (`.t-app` or an
 * element with `data-t-theme`), created on first use. Overlays render there, so they keep the
 * palette's tokens but leave every panel, sheet and scroller whose transform or overflow would
 * otherwise become their containing block. Without a palette root it is the body.
 */
export function overlayHostFor(marker: Element | null): HTMLElement {
  const root = marker?.closest<HTMLElement>(".t-app, [data-t-theme]") ?? document.body;
  const existing = Array.from(root.children).find((el) => el.hasAttribute(OVERLAY_HOST_ATTRIBUTE));
  if (existing) return existing as HTMLElement;
  const host = document.createElement("div");
  host.setAttribute(OVERLAY_HOST_ATTRIBUTE, "");
  root.appendChild(host);
  return host;
}

/** How an overlay behaves: `modal` traps the focus and closes on Esc; `portal` renders into the host. */
export type OverlayOptions = { modal: boolean; portal: boolean };

export type OverlayHandle = {
  /** Ref of the hidden marker where the overlay is declared. */
  markerRef: RefCallback<HTMLSpanElement>;
  /** The overlay host, once the marker is in the document. */
  host: HTMLElement | null;
  /** Whether the content may render now. */
  shown: boolean;
  /** Ref of the overlay element: it takes the focus and holds the Tab trap. */
  ref: RefObject<HTMLElement | null>;
  /** Esc and the Tab trap, for the overlay element. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

/**
 * The behaviour every modal overlay shares: it renders into the overlay host, takes the focus
 * on opening (an element that already holds it, e.g. through `autoFocus`, keeps it), Tab stays
 * inside, Esc calls `onClose`, and on closing the focus returns to the element that had it
 * before. An Esc a child already handled (`event.defaultPrevented`) does not close.
 *
 * Opening takes two commits: the first renders only the marker, whose ref records the trigger
 * before any content (and any `autoFocus` inside it) exists and finds the host; the second
 * renders the content into the host. Without a portal the content renders at once.
 */
export function useOverlay(
  open: boolean,
  onClose: (() => void) | undefined,
  { modal, portal }: OverlayOptions,
): OverlayHandle {
  const ref = useRef<HTMLElement | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  const markerRef = useCallback((marker: HTMLSpanElement | null) => {
    if (marker) {
      trigger.current = document.activeElement as HTMLElement | null;
      setHost(overlayHostFor(marker));
    } else {
      setHost(null);
    }
  }, []);

  const shown = open && (!portal || host !== null);

  useEffect(() => {
    if (!shown || !modal) return undefined;
    const back = trigger.current;
    const node = ref.current;
    if (node && !node.contains(document.activeElement)) initialFocus(node).focus();
    return () => {
      if (back && back.isConnected) back.focus();
    };
  }, [shown, modal]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!modal || event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key !== "Tab" || !ref.current) return;
    const items = focusableIn(ref.current);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === ref.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return { markerRef, host, shown, ref, onKeyDown };
}

/**
 * Places an overlay: in the page flow without a portal, else a hidden marker where it is
 * declared and the content in the overlay host.
 */
export function OverlayLayer({
  markerRef,
  host,
  portal,
  children,
}: {
  markerRef: RefCallback<HTMLSpanElement>;
  host: HTMLElement | null;
  portal: boolean;
  children: ReactNode;
}) {
  if (!portal) return <>{children}</>;
  return (
    <>
      <span ref={markerRef} hidden data-t-overlay-marker="" />
      {host ? createPortal(children, host) : null}
    </>
  );
}
