import { createElement, type ComponentType, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

export type AttributeKind = "string" | "number" | "boolean" | "json";

export type FacetElementDefinition<P> = {
  tag: string;
  component: ComponentType<P>;

  attributes: Record<string, { prop: keyof P & string; kind: AttributeKind }>;

  events?: Partial<Record<keyof P & string, string>>;

  children?: boolean;

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

      if (root) queueMicrotask(() => root.unmount());
    }

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
