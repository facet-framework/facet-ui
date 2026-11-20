import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/AnchorMap/AnchorMap.spec.text";
import { render, screen } from "@testing-library/react";
import AnchorMapWithLogic, { AnchorMap, withAnchorMapLogic } from ".";
import type { Anchor } from "../../../core";

const anchors: Anchor[] = [
  { path: "crates/sync/src/queue.rs", line: 118, role: "primary", excerpt: "pub fn enqueue()" },
  { path: "crates/sync/src/quarantine.rs", line: 44, role: "secondary" },
];

const drift = {
  id: "sync/queue/offline-queue",
  path: "crates/sync/src/quarantine.rs",
  changedAt: "2026-07-26T14:02:00Z",
};

describe("Unit tests for AnchorMap", () => {
  it("renders the summary and entries", () => {
    const { container } = render(
      <AnchorMap
        containerStyle={{}}
        captionStyle={{}}
        caption={labelText.text342}
        entries={[
          {
            key: "a",
            path: "src/a.ts",
            line: ":12",
            role: "primary",
            drifted: false,
            rowStyle: {},
            pathStyle: {},
            lineStyle: {},
            roleStyle: {},
            excerptStyle: {},
          },
        ]}
      />,
    );
    expect(screen.getByText(labelText.text342)).toBeInTheDocument();
    expect(container.querySelectorAll("[data-anchor]")).toHaveLength(1);
  });

  it("links the path when a destination exists", () => {
    render(
      <AnchorMap
        containerStyle={{}}
        captionStyle={{}}
        caption={labelText.text343}
        entries={[
          {
            key: "a",
            path: "src/a.ts",
            line: ":12",
            role: "primary",
            drifted: false,
            href: "https://example.test/src/a.ts#L12",
            rowStyle: {},
            pathStyle: {},
            lineStyle: {},
            roleStyle: {},
            excerptStyle: {},
          },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "src/a.ts" })).toHaveAttribute(
      "href",
      "https://example.test/src/a.ts#L12",
    );
  });
});

describe("Unit tests for withAnchorMapLogic", () => {
  it("counts entry points and files", () => {
    render(<AnchorMapWithLogic anchors={anchors} />);
    expect(screen.getByText(localized.text4)).toBeInTheDocument();
  });

  it("uses singular wording for one entry point", () => {
    render(<AnchorMapWithLogic anchors={[anchors[0]]} />);
    expect(screen.getByText(labelText.text342)).toBeInTheDocument();
  });

  it("reports missing anchors for active records", () => {
    render(<AnchorMapWithLogic anchors={[]} lifecycle="active" />);
    expect(screen.getByText(localized.text7)).toHaveStyle({
      color: "var(--deadline)",
    });
  });

  it("keeps planned records quiet", () => {
    render(<AnchorMapWithLogic anchors={[]} lifecycle="planned" />);
    expect(screen.getByText(localized.text9)).toHaveStyle({ color: "var(--ink)" });
  });

  it("prioritizes and colors moved anchors", () => {
    const { container } = render(<AnchorMapWithLogic anchors={anchors} drift={[drift]} />);
    const rows = container.querySelectorAll("[data-anchor]");
    expect(rows[0]).toHaveAttribute("data-anchor", "crates/sync/src/quarantine.rs:44");
    expect(screen.getByText("crates/sync/src/quarantine.rs")).toHaveStyle({
      color: "var(--deadline)",
    });
  });

  it("reports drift in the summary", () => {
    render(<AnchorMapWithLogic anchors={anchors} drift={[drift]} />);
    expect(screen.getByText(localized.text12)).toBeInTheDocument();
  });

  it("counts multiple changed files instead of naming one", () => {
    const second = { ...drift, path: anchors[0].path };
    render(<AnchorMapWithLogic anchors={anchors} drift={[drift, second]} />);
    expect(screen.getByText(localized.text14)).toBeInTheDocument();
  });

  it("highlights the file rather than its line number", () => {
    const moved = anchors.map((anchor) => ({ ...anchor, line: anchor.line + 12 }));
    render(<AnchorMapWithLogic anchors={moved} drift={[drift]} />);
    expect(screen.getByText(drift.path)).toHaveStyle({ color: "var(--deadline)" });
  });

  it("builds links only with a configured tool", () => {
    const { rerender } = render(<AnchorMapWithLogic anchors={anchors} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    rerender(
      <AnchorMapWithLogic
        anchors={anchors}
        buildHref={(anchor) => `https://example.test/${anchor.path}#L${anchor.line}`}
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("optionally hides excerpts", () => {
    render(<AnchorMapWithLogic anchors={anchors} hideExcerpt />);
    expect(screen.queryByText("pub fn enqueue()")).not.toBeInTheDocument();
  });

  it("identifies line numbers as scan data", () => {
    render(<AnchorMapWithLogic anchors={[anchors[0]]} />);
    expect(screen.getByText(":118")).toHaveStyle({ borderBottomStyle: "dotted" });
  });

  it("sets a descriptive displayName", () => {
    expect(withAnchorMapLogic(AnchorMap).displayName).toBe("withAnchorMapLogic(AnchorMap)");
  });
});

describe("Snapshot tests for AnchorMap", () => {
  it("with entry points", () => {
    const { container } = render(<AnchorMapWithLogic anchors={anchors} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("active record without an entry point", () => {
    const { container } = render(<AnchorMapWithLogic anchors={[]} lifecycle="active" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
