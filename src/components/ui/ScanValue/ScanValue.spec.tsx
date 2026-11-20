import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import ScanValueWithLogic, { ScanValue, withScanValueLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

describe("Unit tests for ScanValue", () => {
  it("shows the value and names the origin as title", () => {
    render(
      <ScanValue computedStyle={{}} originLabel="from the repo scan" data-testid="value">
        84 200
      </ScanValue>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute("title", "from the repo scan");
  });

  it("also makes the origin available to screen readers", () => {
    render(
      <ScanValue computedStyle={{}} originLabel="from the repo scan" data-testid="value">
        96
      </ScanValue>,
    );
    expect(screen.getByTestId("value")).toHaveTextContent("96 (from the repo scan)");
  });
});

describe("Unit tests for withScanValueLogic", () => {
  it("marks the value with a dotted underline", () => {
    render(<ScanValueWithLogic data-testid="value">84 200</ScanValueWithLogic>);
    expect(screen.getByTestId("value")).toHaveStyle({
      borderBottomStyle: "dotted",
      fontFamily: "var(--font-mono)",
    });
  });

  it("names the repo scan as the origin by default", () => {
    render(<ScanValueWithLogic data-testid="value">96</ScanValueWithLogic>);
    expect(screen.getByTestId("value")).toHaveAttribute(
      "title",
      "from the repo scan, not from the record",
    );
  });

  it("tells scan and host apart", () => {
    render(
      <ScanValueWithLogic origin="host" data-testid="value">
        99,4 %
      </ScanValueWithLogic>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute(
      "title",
      "supplied by the host, not from the record",
    );
  });

  it("accepts a precise origin", () => {
    render(
      <ScanValueWithLogic originLabel="Repo scan of 2026-07-28" data-testid="value">
        15
      </ScanValueWithLogic>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute("title", "Repo scan of 2026-07-28");
  });

  it("assigns a descriptive displayName", () => {
    expect(withScanValueLogic(ScanValue).displayName).toBe("withScanValueLogic(ScanValue)");
  });
});

describe("Unit tests for the German locale", () => {
  it("names the origin in German under the German locale", () => {
    renderInGerman(<ScanValueWithLogic data-testid="value">96</ScanValueWithLogic>);
    expect(screen.getByTestId("value")).toHaveAttribute(
      "title",
      germanText.t("elements.scanValue.fromScan"),
    );
  });
});

describe("Snapshot tests for ScanValue", () => {
  it("scan value", () => {
    const { container } = render(<ScanValueWithLogic>84 200</ScanValueWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("host value with its own origin", () => {
    const { container } = render(
      <ScanValueWithLogic origin="host" originLabel="SigNoz">
        99,4 %
      </ScanValueWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
