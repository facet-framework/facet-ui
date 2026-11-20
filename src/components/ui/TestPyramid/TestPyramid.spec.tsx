import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import TestPyramidWithLogic, { TestPyramid, withTestPyramidLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

describe("Unit tests for TestPyramid", () => {
  it("renders one row per level", () => {
    const { container } = render(
      <TestPyramid
        containerStyle={{}}
        captionStyle={{}}
        caption="10 tests"
        levels={[
          {
            key: "unit",
            label: "Unit",
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
    expect(screen.getByText("Unit")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});

describe("Unit tests for withTestPyramidLogic", () => {
  const counts = { unit: 42, property: 6, integration: 18, e2e: 7 };

  it("shows all levels, the empty ones too", () => {
    const { container } = render(<TestPyramidWithLogic counts={{ unit: 3 }} />);
    expect(container.querySelectorAll("[data-level]")).toHaveLength(4);
  });

  it("turns shares into bar widths", () => {
    const { container } = render(<TestPyramidWithLogic counts={{ unit: 3, e2e: 1 }} />);
    const bar = container.querySelector('[data-level="unit"] span:nth-child(2)');
    expect(bar).toHaveStyle({ width: "75%" });
  });

  it("counts tests and occupied levels", () => {
    render(<TestPyramidWithLogic counts={counts} />);
    expect(screen.getByText(/73 tests across 4 levels/)).toBeInTheDocument();
  });

  it("reports a broad base", () => {
    render(<TestPyramidWithLogic counts={counts} />);
    expect(screen.getByText(/The base is wider than the top/)).toBeInTheDocument();
  });

  it("reports a top-heavy distribution", () => {
    render(<TestPyramidWithLogic counts={{ unit: 2, e2e: 19 }} />);
    expect(screen.getByText(/expensive tests carry the load/)).toBeInTheDocument();
  });

  it("says so when no tests are named", () => {
    render(<TestPyramidWithLogic counts={{}} />);
    expect(screen.getByText("No tests named.")).toBeInTheDocument();
  });

  it("uses the right grammatical number for a single test", () => {
    render(<TestPyramidWithLogic counts={{ unit: 1 }} />);
    expect(screen.getByText(/1 test across 1 levels/)).toBeInTheDocument();
  });

  it("accepts custom levels", () => {
    const { container } = render(
      <TestPyramidWithLogic counts={{ unit: 2 }} kinds={["unit", "e2e"]} />,
    );
    expect(container.querySelectorAll("[data-level]")).toHaveLength(2);
  });

  it("assigns a descriptive displayName", () => {
    expect(withTestPyramidLogic(TestPyramid).displayName).toBe("withTestPyramidLogic(TestPyramid)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<TestPyramidWithLogic counts={{ unit: 2, e2e: 19 }} />);
    expect(
      screen.getByText(germanText.t("elements.testPyramid.topWider"), { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        germanText.t("elements.testPyramid.caption", {
          tests: germanText.plural("elements.testPyramid.tests", 21),
          levels: 2,
          shape: germanText.t("elements.testPyramid.topWider"),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(germanText.t("core.label.testKind.unit"))).toBeInTheDocument();
  });
});

describe("Snapshot tests for TestPyramid", () => {
  it("broad base", () => {
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
