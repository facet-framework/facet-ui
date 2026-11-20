import { createElement, type ComponentType, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * Bridge from React to custom elements: the same components without the
 * host having to know React. Attributes are mapped to props, complex values
 * (records, anchors, promises) come as a JSON attribute or as a property.
 */

export type AttributeKind = "string" | "number" | "boolean" | "json";

export type FacetElementDefinition<P> = {
  /** Tag name, always starting with `facet-`. */
  tag: string;
  component: ComponentType<P>;
  /** Attribute name → prop name and type. `data-anchors` → `anchors`. */
  attributes: Record<string, { prop: keyof P & string; kind: AttributeKind }>;
  /**
   * Callback prop → name of the DOM event that is dispatched instead.
   *
   * A host without React cannot pass a function as an attribute. Instead of
   * pointing it to `setProps` — which again requires JavaScript with knowledge
   * of the library — the element reports the way an element
   * reports: with an event. The callback's first argument is in
   * `event.detail`.
   */
  events?: Partial<Record<keyof P & string, string>>;
  /**
   * The element's content is passed through as `children`.
   *
   * React takes over the element's inside on the first render, so it is
   * saved beforehand. It is the host's markup in its own page —
   * the same origin as everything else in it.
   */
  children?: boolean;
  /** Props that are always set. */
  defaults?: Partial<P>;
};

function parseValue(raw: string | null, kind: AttributeKind): unknown {
  if (raw == null) return undefined;
  if (kind === "number") {
    const value = Number(raw);
    return Number.isNaN(value) ? undefined : value;
  }
  if (kind === "boolean") return raw !== "false";
  if (kind === "json") {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw;
}

/**
 * Registers a custom element. Registering the same tag more than once is
 * harmless — the second call is ignored.
 */
export function defineFacetElement<P extends object>(definition: FacetElementDefinition<P>): void {
  if (typeof window === "undefined" || !window.customElements) return;
  if (window.customElements.get(definition.tag)) return;

  const attributeNames = Object.keys(definition.attributes);

  class FacetElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return attributeNames;
    }

    private root: Root | null = null;
    private props: Partial<P> = { ...definition.defaults };
    private captured: string | null = null;

    connectedCallback(): void {
      if (definition.children && this.captured == null) {
        // Save before the first render: after that the inside belongs to React.
        this.captured = this.innerHTML.trim();
      }
      if (!this.root) this.root = createRoot(this);
      this.readAttributes();
      this.bindEvents();
      this.render();
    }

    attributeChangedCallback(): void {
      if (!this.root) return;
      this.readAttributes();
      this.render();
    }

    disconnectedCallback(): void {
      const root = this.root;
      this.root = null;
      // Unmount outside the callback, otherwise React warns while cleaning up.
      if (root) queueMicrotask(() => root.unmount());
    }

    /** Sets props directly — the way for objects and callbacks. */
    setProps(next: Partial<P>): void {
      this.props = { ...this.props, ...next };
      this.render();
    }

    private readAttributes(): void {
      attributeNames.forEach((name) => {
        const spec = definition.attributes[name];
        const value = parseValue(this.getAttribute(name), spec.kind);
        if (value !== undefined) {
          (this.props as Record<string, unknown>)[spec.prop] = value;
        }
      });
    }

    /**
     * Creates, for every registered callback, one that dispatches an event.
     * A callback set via `setProps` stays in place — whoever knows React
     * should not have to go through an event.
     */
    private bindEvents(): void {
      Object.entries(definition.events ?? {}).forEach(([prop, type]) => {
        const props = this.props as Record<string, unknown>;
        if (typeof props[prop] === "function") return;
        props[prop] = (detail: unknown) => {
          this.dispatchEvent(new CustomEvent(String(type), { detail, bubbles: true }));
        };
      });
    }

    private render(): void {
      const props = { ...this.props } as P & { children?: ReactNode };
      if (definition.children && this.captured) {
        props.children = createElement("span", {
          dangerouslySetInnerHTML: { __html: this.captured },
        });
      }
      this.root?.render(createElement(definition.component, props));
    }
  }

  window.customElements.define(definition.tag, FacetElement);
}
