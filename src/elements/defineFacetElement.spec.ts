import { labelText } from "../i18n/legacy/labels";
import { localized } from "../i18n/legacy/elements/defineFacetElement.spec.text";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { defineFacetElement } from "./defineFacetElement";
import { defineFacetElements, FACET_ELEMENT_TAGS } from ".";

async function mount(html: string): Promise<void> {
  defineFacetElements();
  await act(async () => {
    document.body.innerHTML = html;
  });
}

function Probe(props: { label?: string; count?: number; open?: boolean; data?: { a: number } }) {
  return `${props.label ?? ""}|${props.count ?? ""}|${props.open ?? ""}|${
    props.data ? props.data.a : ""
  }` as unknown as null;
}

type ProbeProps = { label?: string; count?: number; open?: boolean; data?: { a: number } };

const attributes = {
  label: { prop: "label", kind: "string" },
  count: { prop: "count", kind: "number" },
  open: { prop: "open", kind: "boolean" },
  data: { prop: "data", kind: "json" },
} as const;

describe("Unit tests for defineFacetElement", () => {
  it("registers the element exactly once", () => {
    defineFacetElement<ProbeProps>({ tag: "probe-once", component: Probe, attributes });
    defineFacetElement<ProbeProps>({ tag: "probe-once", component: Probe, attributes });
    expect(customElements.get("probe-once")).toBeDefined();
  });

  it("observes every declared attribute", () => {
    defineFacetElement<ProbeProps>({ tag: "probe-attrs", component: Probe, attributes });
    const Element = customElements.get("probe-attrs") as CustomElementConstructor & {
      observedAttributes: string[];
    };
    expect(Element.observedAttributes).toEqual(["label", "count", "open", "data"]);
  });

  it("renders on mount and cleans up on unmount", () => {
    defineFacetElement<ProbeProps>({ tag: "probe-mount", component: Probe, attributes });
    const node = document.createElement("probe-mount");
    node.setAttribute("label", "Quick add");
    document.body.appendChild(node);
    expect(node.isConnected).toBe(true);
    node.remove();
    expect(node.isConnected).toBe(false);
  });

  it("also accepts props directly", () => {
    defineFacetElement<ProbeProps>({ tag: "probe-props", component: Probe, attributes });
    const node = document.createElement("probe-props") as HTMLElement & {
      setProps: (props: Partial<ProbeProps>) => void;
    };
    document.body.appendChild(node);
    expect(() => node.setProps({ data: { a: 1 } })).not.toThrow();
    node.remove();
  });

  it("ignores invalid JSON instead of throwing", () => {
    defineFacetElement<ProbeProps>({ tag: "probe-json", component: Probe, attributes });
    const node = document.createElement("probe-json");
    node.setAttribute("data", labelText.text337);
    expect(() => document.body.appendChild(node)).not.toThrow();
    node.remove();
  });

  it("does nothing without custom-element support", () => {
    const original = window.customElements;
    Object.defineProperty(window, "customElements", { value: undefined, configurable: true });
    expect(() =>
      defineFacetElement<ProbeProps>({ tag: "probe-none", component: Probe, attributes }),
    ).not.toThrow();
    Object.defineProperty(window, "customElements", { value: original, configurable: true });
  });
});

describe("children from the light DOM", () => {
  it("forwards element contents as children", async () => {
    await mount(localized.text6);

    expect(document.querySelector("facet-button button")?.textContent).toContain(localized.text7);
  });

  it("preserves markup written by the host", async () => {
    await mount(localized.text9);

    expect(document.querySelector("facet-text b")?.textContent).toBe(labelText.extra2);
  });
});

describe("callbacks as events", () => {
  it("reports clicks as DOM events", async () => {
    await mount("<facet-button>Los</facet-button>");
    const element = document.querySelector("facet-button") as HTMLElement;
    const heard: Event[] = [];
    element.addEventListener("facet-click", (event) => heard.push(event));

    await act(async () => {
      (element.querySelector("button") as HTMLButtonElement).click();
    });

    expect(heard).toHaveLength(1);
  });

  it("bubbles events to ancestor listeners", async () => {
    await mount(labelText.extra3);
    const heard: Event[] = [];
    document
      .getElementById(labelText.extra4)!
      .addEventListener("facet-click", (e) => heard.push(e));

    await act(async () => {
      (document.querySelector("facet-button button") as HTMLButtonElement).click();
    });

    expect(heard).toHaveLength(1);
  });

  it("preserves callbacks supplied through setProps", async () => {
    defineFacetElements();
    const element = document.createElement("facet-button") as HTMLElement & {
      setProps: (p: Record<string, unknown>) => void;
    };
    const direct = jest.fn();
    await act(async () => {
      document.body.appendChild(element);
    });
    await act(async () => {
      element.setProps({ onClick: direct });
    });

    await act(async () => {
      (element.querySelector("button") as HTMLButtonElement).click();
    });

    expect(direct).toHaveBeenCalled();
  });
});

describe("completeness", () => {
  it("registers every library component", () => {
    defineFacetElements();

    const fehlend = FACET_ELEMENT_TAGS.filter((tag) => !customElements.get(tag));
    expect(fehlend).toEqual([]);
  });

  it("leaves no component without an element", () => {
    const dir = join(__dirname, "..", "components", "ui");
    const komponenten = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());

    expect(FACET_ELEMENT_TAGS).toHaveLength(komponenten.length);
  });
});
