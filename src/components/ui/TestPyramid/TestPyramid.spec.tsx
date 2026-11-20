import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/TestPyramid/TestPyramid.spec.text";
import { render, screen } from "@testing-library/react";
import TestPyramidWithLogic, { TestPyramid, withTestPyramidLogic } from ".";

describe("Unit tests for TestPyramid", () => {
  it("renders one row per level", () => {
    const { container } = render(
      <TestPyramid
        containerStyle={{}}
        captionStyle={{}}
        caption="10 Tests"
        levels={[
          {
            key: "unit",
            label: remainingText.text18,
            count: 8,
            share: 80,
            rowStyle: {},
            labelStyle: {},
            barStyle: {},
            countStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-level]")).toHaveLength(1);
    expect(screen.getByText(remainingText.text18)).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});

describe("Unit tests for withTestPyramidLogic", () => {
  const counts = { unit: 42, property: 6, integration: 18, e2e: 7 };

  it("shows all levels including empty ones", () => {
    const { container } = render(<TestPyramidWithLogic counts={{ unit: 3 }} />);
    expect(container.querySelectorAll("[data-level]")).toHaveLength(4);
  });

  it("marks the value with a dotted underline", () => {
    const { container } = render(<TestPyramidWithLogic counts={{ unit: 3, e2e: 1 }} />);
    const bar = container.querySelector('[data-level="unit"] span:nth-child(2)');
    expect(bar).toHaveStyle({ width: "75%" });
  });

  it("counts tests and populated levels", () => {
    render(<TestPyramidWithLogic counts={counts} />);
    expect(screen.getByText(localized.text4)).toBeInTheDocument();
  });

  it("reports a broad base", () => {
    render(<TestPyramidWithLogic counts={counts} />);
    expect(screen.getByText(localized.text6)).toBeInTheDocument();
  });

  it("reports a top-heavy distribution", () => {
    render(<TestPyramidWithLogic counts={{ unit: 2, e2e: 19 }} />);
    expect(screen.getByText(localized.text8)).toBeInTheDocument();
  });

  it("reports when no tests are named", () => {
    render(<TestPyramidWithLogic counts={{}} />);
    expect(screen.getByText(localized.text10)).toBeInTheDocument();
  });

  it("uses singular wording for one test", () => {
    render(<TestPyramidWithLogic counts={{ unit: 1 }} />);
    expect(screen.getByText(localized.text12)).toBeInTheDocument();
  });

  it("converts shares into bar widths", () => {
    const { container } = render(
      <TestPyramidWithLogic counts={{ unit: 2 }} kinds={["unit", "e2e"]} />,
    );
    expect(container.querySelectorAll("[data-level]")).toHaveLength(2);
  });

  it("sets a descriptive displayName", () => {
    expect(withTestPyramidLogic(TestPyramid).displayName).toBe("withTestPyramidLogic(TestPyramid)");
  });
});

describe("Snapshot tests for TestPyramid", () => {
  it("accepts custom levels", () => {
    const { container } = render(
      <TestPyramidWithLogic counts={{ unit: 42, property: 6, integration: 18, e2e: 7 }} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without tests", () => {
    const { container } = render(<TestPyramidWithLogic counts={{}} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
