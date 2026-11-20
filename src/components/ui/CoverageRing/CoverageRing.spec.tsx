import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import CoverageRingWithLogic, { CoverageRing, withCoverageRingLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const base = {
  size: 96,
  circumference: 276,
  dash: 138,
  strokeWidth: 8,
  trackColor: "var(--line)",
  fillColor: "var(--signal)",
  display: "50 %",
  label: "19 of 38 promises with a mapped test",
  labelStyle: {},
  containerStyle: {},
};

describe("Unit tests for CoverageRing", () => {
  it("names the share in plain words", () => {
    render(<CoverageRing {...base} />);
    expect(
      screen.getByRole("img", { name: "19 of 38 promises with a mapped test" }),
    ).toBeInTheDocument();
  });

  it("shows the percentage in the middle", () => {
    render(<CoverageRing {...base} />);
    expect(screen.getByText("50 %")).toBeInTheDocument();
  });

  it("draws track and arc", () => {
    const { container } = render(<CoverageRing {...base} />);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("sets the arc as a dash pattern", () => {
    const { container } = render(<CoverageRing {...base} />);
    expect(container.querySelectorAll("circle")[1]).toHaveAttribute("stroke-dasharray", "138 138");
  });
});

describe("Unit tests for withCoverageRingLogic", () => {
  it("computes the share in percent", () => {
    render(<CoverageRingWithLogic value={31} total={38} />);
    expect(screen.getByText("82 %")).toBeInTheDocument();
  });

  it("phrases the plain words from value and reference total", () => {
    render(<CoverageRingWithLogic value={31} total={38} />);
    expect(
      screen.getByRole("img", { name: "31 of 38 promises with a mapped test" }),
    ).toBeInTheDocument();
  });

  it("colours full coverage green", () => {
    const { container } = render(<CoverageRingWithLogic value={38} total={38} />);
    expect(container.querySelectorAll("circle")[1]).toHaveStyle({ stroke: "var(--ok)" });
  });

  it("says nothing when the reference total is missing", () => {
    render(<CoverageRingWithLogic value={0} total={0} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("phrases the plain words in German under the German locale", () => {
    renderInGerman(<CoverageRingWithLogic value={31} total={38} />);
    expect(
      screen.getByRole("img", {
        name: germanText.t("elements.coverageRing.label", { value: "31", total: "38" }),
      }),
    ).toBeInTheDocument();
  });

  it("accepts an own size", () => {
    const { container } = render(<CoverageRingWithLogic value={1} total={2} size={56} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "56");
  });

  it("accepts its own plain words", () => {
    render(<CoverageRingWithLogic value={1} total={2} label="Half backed" />);
    expect(screen.getByRole("img", { name: "Half backed" })).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withCoverageRingLogic(CoverageRing).displayName).toBe(
      "withCoverageRingLogic(CoverageRing)",
    );
  });
});

describe("Snapshot tests for CoverageRing", () => {
  it("partly covered", () => {
    const { container } = render(<CoverageRingWithLogic value={31} total={38} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without promises", () => {
    const { container } = render(<CoverageRingWithLogic value={0} total={0} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
