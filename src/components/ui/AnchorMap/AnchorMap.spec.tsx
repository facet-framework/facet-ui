import { render, screen } from "@testing-library/react";
import AnchorMapWithLogic, { AnchorMap, withAnchorMapLogic } from ".";
import type { Anchor } from "../../../core";
import { renderInGerman } from "../../../facet/i18n/testing";

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
  it("renders the answer line and entries", () => {
    const { container } = render(
      <AnchorMap
        containerStyle={{}}
        captionStyle={{}}
        caption="1 entry point in 1 file."
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
    expect(screen.getByText("1 entry point in 1 file.")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-anchor]")).toHaveLength(1);
  });

  it("turns the path into a link when a target exists", () => {
    render(
      <AnchorMap
        containerStyle={{}}
        captionStyle={{}}
        caption="1 entry point"
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
    expect(screen.getByText("2 entry points in 2 files.")).toBeInTheDocument();
  });

  it("uses the right grammatical number for a single entry point", () => {
    render(<AnchorMapWithLogic anchors={[anchors[0]]} />);
    expect(screen.getByText("1 entry point in 1 file.")).toBeInTheDocument();
  });

  it("turns the absence on active records into a finding", () => {
    render(<AnchorMapWithLogic anchors={[]} lifecycle="active" />);
    expect(screen.getByText(/Active, but no entry point in code/)).toHaveStyle({
      color: "var(--due)",
    });
  });

  it("stays quiet for planned records", () => {
    render(<AnchorMapWithLogic anchors={[]} lifecycle="planned" />);
    expect(screen.getByText("No entry point in code.")).toHaveStyle({ color: "var(--ink)" });
  });

  it("moves shifted anchors to the front and colours them", () => {
    const { container } = render(<AnchorMapWithLogic anchors={anchors} drift={[drift]} />);
    const rows = container.querySelectorAll("[data-anchor]");
    expect(rows[0]).toHaveAttribute("data-anchor", "crates/sync/src/quarantine.rs:44");
    expect(screen.getByText("crates/sync/src/quarantine.rs")).toHaveStyle({
      color: "var(--due)",
    });
  });

  it("reports the drift in the answer line", () => {
    render(<AnchorMapWithLogic anchors={anchors} drift={[drift]} />);
    expect(screen.getByText(/1 file changed, the record did not/)).toBeInTheDocument();
  });

  it("counts several changed files instead of naming one of them", () => {
    const second = { ...drift, path: anchors[0].path };
    render(<AnchorMapWithLogic anchors={anchors} drift={[drift, second]} />);
    expect(screen.getByText(/2 files changed, the record did not/)).toBeInTheDocument();
  });

  it("marks the file, not the line number", () => {
    // Drift follows the file path even when anchor lines move.
    const moved = anchors.map((anchor) => ({ ...anchor, line: anchor.line + 12 }));
    render(<AnchorMapWithLogic anchors={moved} drift={[drift]} />);
    expect(screen.getByText(drift.path)).toHaveStyle({ color: "var(--due)" });
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

  it("hides excerpts on request", () => {
    render(<AnchorMapWithLogic anchors={anchors} hideExcerpt />);
    expect(screen.queryByText("pub fn enqueue()")).not.toBeInTheDocument();
  });

  it("marks the line number as scan material", () => {
    render(<AnchorMapWithLogic anchors={[anchors[0]]} />);
    expect(screen.getByText(":118")).toHaveStyle({ borderBottomStyle: "dotted" });
  });

  it("speaks German under the German locale", () => {
    renderInGerman(<AnchorMapWithLogic anchors={anchors} drift={[drift]} />);
    expect(screen.getByText(/2 Einstiege in 2 Dateien\./)).toBeInTheDocument();
    expect(screen.getByText(/1 Datei hat sich geändert, der Record nicht/)).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withAnchorMapLogic(AnchorMap).displayName).toBe("withAnchorMapLogic(AnchorMap)");
  });
});

describe("Snapshot tests for AnchorMap", () => {
  it("with entry points", () => {
    const { container } = render(<AnchorMapWithLogic anchors={anchors} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without an entry point on an active record", () => {
    const { container } = render(<AnchorMapWithLogic anchors={[]} lifecycle="active" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
