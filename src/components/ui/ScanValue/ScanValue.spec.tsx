import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/ScanValue/ScanValue.spec.text";
import { render, screen } from "@testing-library/react";
import ScanValueWithLogic, { ScanValue, withScanValueLogic } from ".";

describe("Unit tests for ScanValue", () => {
  it("shows the value and names its source in the title", () => {
    render(
      <ScanValue computedStyle={{}} originLabel={germanLabels.text183} data-testid="value">
        84 200
      </ScanValue>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute("title", germanLabels.text183);
  });

  it("also exposes the source to screen readers", () => {
    render(
      <ScanValue computedStyle={{}} originLabel={germanLabels.text183} data-testid="value">
        96
      </ScanValue>,
    );
    expect(screen.getByTestId("value")).toHaveTextContent(germanLabels.text184);
  });
});

describe("Unit tests for withScanValueLogic", () => {
  it("describes the segments", () => {
    render(<ScanValueWithLogic data-testid="value">84 200</ScanValueWithLogic>);
    expect(screen.getByTestId("value")).toHaveStyle({
      borderBottomStyle: "dotted",
      fontFamily: "var(--font-mono)",
    });
  });

  it("uses the repository scan as the default source", () => {
    render(<ScanValueWithLogic data-testid="value">96</ScanValueWithLogic>);
    expect(screen.getByTestId("value")).toHaveAttribute("title", localized.text4);
  });

  it("distinguishes scan and host values", () => {
    render(
      <ScanValueWithLogic origin="host" data-testid="value">
        99,4 %
      </ScanValueWithLogic>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute("title", localized.text6);
  });

  it("accepts a precise source", () => {
    render(
      <ScanValueWithLogic originLabel="Repo-Scan vom 2026-07-28" data-testid="value">
        15
      </ScanValueWithLogic>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute("title", "Repo-Scan vom 2026-07-28");
  });

  it("sets a descriptive displayName", () => {
    expect(withScanValueLogic(ScanValue).displayName).toBe("withScanValueLogic(ScanValue)");
  });
});

describe("Snapshot tests for ScanValue", () => {
  it("Scan value", () => {
    const { container } = render(<ScanValueWithLogic>84 200</ScanValueWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("host value with a custom source", () => {
    const { container } = render(
      <ScanValueWithLogic origin="host" originLabel="SigNoz">
        99,4 %
      </ScanValueWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
