import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/SegmentBand/SegmentBand.spec.text";
import { render, screen } from "@testing-library/react";
import SegmentBandWithLogic, { SegmentBand, withSegmentBandLogic } from ".";

const segments = [
  { key: "active", label: remainingText.text7, value: 11, color: "var(--ink)" },
  { key: "planned", label: remainingText.text23, value: 4, color: "var(--plan)" },
  { key: "deprecated", label: localized.text1, value: 5, color: "var(--line-2)" },
];

describe("Unit tests for SegmentBand", () => {
  it("renders each segment at its width", () => {
    const { container } = render(
      <SegmentBand
        containerStyle={{}}
        label={labelText.text334}
        segments={[
          { key: "a", width: "60%", background: "var(--ink)", title: remainingText.text128 },
          { key: "b", width: "40%", background: "var(--plan)", title: remainingText.text129 },
        ]}
      />,
    );
    const parts = container.querySelectorAll("[data-segment]");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveStyle({ width: "60%" });
  });

  it("provides a readable screen-reader label", () => {
    render(<SegmentBand containerStyle={{}} label={remainingText.text130} segments={[]} />);
    expect(screen.getByRole("img", { name: remainingText.text130 })).toBeInTheDocument();
  });
});

describe("Unit tests for withSegmentBandLogic", () => {
  it("horizontal", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} />);
    expect(container.querySelector('[data-segment="active"]')).toHaveStyle({ width: "55%" });
  });

  it("omits empty segments", () => {
    const { container } = render(
      <SegmentBandWithLogic
        segments={[
          ...segments,
          { key: "draft", label: remainingText.text24, value: 0, color: "var(--dim)" },
        ]}
      />,
    );
    expect(container.querySelector('[data-segment="draft"]')).toBeNull();
  });

  it("uses correct singular and plural forms", () => {
    render(<SegmentBandWithLogic segments={segments} />);
    expect(screen.getByRole("img", { name: localized.text5 })).toBeInTheDocument();
  });

  it("reports an empty collection", () => {
    render(
      <SegmentBandWithLogic
        segments={[{ key: "a", label: remainingText.text7, value: 0, color: "var(--ink)" }]}
      />,
    );
    expect(screen.getByRole("img", { name: localized.text7 })).toBeInTheDocument();
  });

  it("accepts a custom accessible label", () => {
    render(<SegmentBandWithLogic segments={segments} label={localized.text9} />);
    expect(screen.getByRole("img", { name: localized.text10 })).toBeInTheDocument();
  });

  it("sets the band height", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} height={6} />);
    expect(container.firstChild).toHaveStyle({ height: "6px" });
  });

  it("labels each segment with its count", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} />);
    expect(container.querySelector('[data-segment="planned"]')).toHaveAttribute(
      "title",
      remainingText.text129,
    );
  });

  it("sets a descriptive displayName", () => {
    expect(withSegmentBandLogic(SegmentBand).displayName).toBe("withSegmentBandLogic(SegmentBand)");
  });
});

describe("Snapshot tests for SegmentBand", () => {
  it("Lifecycle", () => {
    const { container } = render(<SegmentBandWithLogic segments={segments} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("empty collection", () => {
    const { container } = render(
      <SegmentBandWithLogic
        segments={[{ key: "a", label: remainingText.text7, value: 0, color: "var(--ink)" }]}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
