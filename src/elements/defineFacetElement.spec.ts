import { readdirSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { defineFacetElement } from "./defineFacetElement";
import { defineFacetElements, FACET_ELEMENT_TAGS } from ".";

/**
 * Mounts markup and lets React finish rendering.
 *
 * Without `act`, only the light DOM is there after mounting: `createRoot`
 * schedules its work instead of doing it immediately. The older tests here only
 * checked registration and lifecycle, which is why this never surfaced.
 */
async function mount(html: string): Promise<void> {
  defineFacetElements();
  await act(async () => {
    document.body.innerHTML = html;
  });
}

/** A minimal component that makes its props visible. */
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

  it("observes all declared attributes", () => {
    defineFacetElement<ProbeProps>({ tag: "probe-attrs", component: Probe, attributes });
    const Element = customElements.get("probe-attrs") as CustomElementConstructor & {
      observedAttributes: string[];
    };
    expect(Element.observedAttributes).toEqual(["label", "count", "open", "data"]);
  });

  it("renders on connect and cleans up on disconnect", () => {
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

  it("ignores broken JSON instead of throwing", () => {
    defineFacetElement<ProbeProps>({ tag: "probe-json", component: Probe, attributes });
    const node = document.createElement("probe-json");
    node.setAttribute("data", "{kaputt");
    expect(() => document.body.appendChild(node)).not.toThrow();
    node.remove();
  });

  it("does nothing without custom elements support", () => {
    const original = window.customElements;
    Object.defineProperty(window, "customElements", { value: undefined, configurable: true });
    expect(() =>
      defineFacetElement<ProbeProps>({ tag: "probe-none", component: Probe, attributes }),
    ).not.toThrow();
    Object.defineProperty(window, "customElements", { value: original, configurable: true });
  });
});

describe("children from the light DOM", () => {
  it("passes the element's content through as children", async () => {
    await mount("<facet-button>Open register</facet-button>");

    // The text is inside the button React built — no longer in the light DOM.
    expect(document.querySelector("facet-button button")?.textContent).toContain("Open register");
  });

  it("takes over markup the host wrote itself", async () => {
    await mount("<facet-text><b>bold</b> and plain</facet-text>");

    expect(document.querySelector("facet-text b")?.textContent).toBe("bold");
  });
});

describe("callbacks as events", () => {
  it("reports a click as a DOM event", async () => {
    await mount("<facet-button>Los</facet-button>");
    const element = document.querySelector("facet-button") as HTMLElement;
    const heard: Event[] = [];
    element.addEventListener("facet-click", (event) => heard.push(event));

    await act(async () => {
      (element.querySelector("button") as HTMLButtonElement).click();
    });

    // A host without React cannot pass a function as an attribute; so the
    // element announces itself the way an element announces itself.
    expect(heard).toHaveLength(1);
  });

  it("bubbles, so a listener further up suffices", async () => {
    await mount("<div id='huelle'><facet-button>Los</facet-button></div>");
    const heard: Event[] = [];
    document.getElementById("huelle")!.addEventListener("facet-click", (e) => heard.push(e));

    await act(async () => {
      (document.querySelector("facet-button button") as HTMLButtonElement).click();
    });

    expect(heard).toHaveLength(1);
  });

  it("keeps a callback set via setProps", async () => {
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

    // Whoever knows React should not have to go through an event.
    expect(direct).toHaveBeenCalled();
  });
});

describe("completeness", () => {
  it("registers every component of the library", () => {
    defineFacetElements();

    const fehlend = FACET_ELEMENT_TAGS.filter((tag) => !customElements.get(tag));
    expect(fehlend).toEqual([]);
  });

  it("leaves no component without an element", () => {
    // Counted instead of listed: a fixed number in the test would just be a line
    // to drag along with the next addition. This way it shows when someone adds
    // a component and forgets its element — otherwise the library would be
    // silently smaller in the standalone bundle than in the import.
    const dir = join(__dirname, "..", "components", "ui");
    const komponenten = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());

    expect(FACET_ELEMENT_TAGS).toHaveLength(komponenten.length);
  });
});
