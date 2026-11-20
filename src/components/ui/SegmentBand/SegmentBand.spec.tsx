import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import SegmentBandWithLogic, { SegmentBand, withSegmentBandLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const segments = [
  { key: "active", label: "active", value: 11, color: "var(--ink)" },
  { key: "planned", label: "planned", value: 4, color: "var(--plan)" },
  { key: "deprecated", label: "deprecated", value: 5, color: "var(--line-2)" },
];

describe("Unit tests for SegmentBand", () => {
  it("renders every segment with its width", () => {
    const { container } = render(
      <SegmentBand
        containerStyle={{}}
        label="Distribution"
        segments={[
          { key: "a", width: "60%", background: "var(--ink)", title: "active · 6" },
          { key: "b", width: "40%", background: "var(--plan)", title: "planned · 4" },
        ]}
      />,
    );
    const parts = container.querySelectorAll("[data-segment]");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveStyle({ width: "60%" });
  });

  it("carries the plain text for screen readers", () => {
    render(<SegmentBand containerStyle={{}} label="active 11 · planned 4" segments={[]} />);
    expect(screen.getByRole("img", { name: "active 11 · planned 4" })).toBeInTheDocument();
  });
});

describe("Unit tests for withSegmentBandLogic", () => {
  it("turns values into shares", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} />);
    expect(container.querySelector('[data-segment="active"]')).toHaveStyle({ width: "55%" });
  });

  it("omits empty segments", () => {
    const { container } = render(
      <SegmentBandWithLogic
        segments={[...segments, { key: "draft", label: "draft", value: 0, color: "var(--dim)" }]}
      />,
    );
    expect(container.querySelector('[data-segment="draft"]')).toBeNull();
  });

  it("phrases the plain text from the segments", () => {
    render(<SegmentBandWithLogic segments={segments} />);
    expect(
      screen.getByRole("img", { name: "active 11 · planned 4 · deprecated 5" }),
    ).toBeInTheDocument();
  });

  it("says nothing is there for an empty set", () => {
    render(
      <SegmentBandWithLogic
        segments={[{ key: "a", label: "active", value: 0, color: "var(--ink)" }]}
      />,
    );
    expect(screen.getByRole("img", { name: "no entries" })).toBeInTheDocument();
  });

  it("accepts a custom plain text", () => {
    render(<SegmentBandWithLogic segments={segments} label="Lifecycle across 20 records" />);
    expect(screen.getByRole("img", { name: "Lifecycle across 20 records" })).toBeInTheDocument();
  });

  it("sets the band height", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} height={6} />);
    expect(container.firstChild).toHaveStyle({ height: "6px" });
  });

  it("labels every segment with its count", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} />);
    expect(container.querySelector('[data-segment="planned"]')).toHaveAttribute(
      "title",
      "planned · 4",
    );
  });

  it("assigns a descriptive displayName", () => {
    expect(withSegmentBandLogic(SegmentBand).displayName).toBe("withSegmentBandLogic(SegmentBand)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<SegmentBandWithLogic segments={[]} />);
    expect(
      screen.getByRole("img", { name: germanText.t("elements.segmentBand.empty") }),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for SegmentBand", () => {
  it("lifecycle", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("empty set", () => {
    const { container } = render(
      <SegmentBandWithLogic
        segments={[{ key: "a", label: "active", value: 0, color: "var(--ink)" }]}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
