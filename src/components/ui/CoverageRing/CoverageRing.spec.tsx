import { localized } from "../../../i18n/legacy/components/ui/CoverageRing/CoverageRing.spec.text";
import { render, screen } from "@testing-library/react";
import CoverageRingWithLogic, { CoverageRing, withCoverageRingLogic } from ".";

const base = {
  size: 96,
  circumference: 276,
  dash: 138,
  strokeWidth: 8,
  trackColor: "var(--line)",
  fillColor: "var(--signal)",
  display: "50 %",
  label: localized.text1,
  labelStyle: {},
  containerStyle: {},
};

describe("Unit tests for CoverageRing", () => {
  it("accepts composite values", () => {
    render(<CoverageRing {...base} />);
    expect(screen.getByRole("img", { name: localized.text2 })).toBeInTheDocument();
  });

  it("shows the percentage in the center", () => {
    render(<CoverageRing {...base} />);
    expect(screen.getByText("50 %")).toBeInTheDocument();
  });

  it("draws the track and arc", () => {
    const { container } = render(<CoverageRing {...base} />);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("uses a dash pattern for the arc", () => {
    const { container } = render(<CoverageRing {...base} />);
    expect(container.querySelectorAll("circle")[1]).toHaveAttribute("stroke-dasharray", "138 138");
  });
});

describe("Unit tests for withCoverageRingLogic", () => {
  it("prioritizes open entry points", () => {
    render(<CoverageRingWithLogic value={31} total={38} />);
    expect(screen.getByText("82 %")).toBeInTheDocument();
  });

  it("describes the value and total", () => {
    render(<CoverageRingWithLogic value={31} total={38} />);
    expect(screen.getByRole("img", { name: localized.text7 })).toBeInTheDocument();
  });

  it("colors full coverage green", () => {
    const { container } = render(<CoverageRingWithLogic value={38} total={38} />);
    expect(container.querySelectorAll("circle")[1]).toHaveStyle({ stroke: "var(--ok)" });
  });

  it("makes no claim without a total", () => {
    render(<CoverageRingWithLogic value={0} total={0} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("accepts a custom size", () => {
    const { container } = render(<CoverageRingWithLogic value={1} total={2} size={56} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "56");
  });

  it("accepts a custom accessible label", () => {
    render(<CoverageRingWithLogic value={1} total={2} label={localized.text12} />);
    expect(screen.getByRole("img", { name: localized.text13 })).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withCoverageRingLogic(CoverageRing).displayName).toBe(
      "withCoverageRingLogic(CoverageRing)",
    );
  });
});

describe("Snapshot tests for CoverageRing", () => {
  it("enters from the right", () => {
    const { container } = render(<CoverageRingWithLogic value={31} total={38} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without promises", () => {
    const { container } = render(<CoverageRingWithLogic value={0} total={0} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
