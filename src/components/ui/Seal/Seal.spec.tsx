import { render, screen } from "@testing-library/react";
import SealWithLogic, { Seal, withSealLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

describe("Unit tests for Seal", () => {
  it("renders one stripe per facet", () => {
    const { container } = render(
      <Seal
        containerStyle={{}}
        countStyle={{}}
        count="2/7"
        label="2 of 7 facets filled"
        stripes={[
          { key: "intent", label: "Purpose — filled", filled: true, style: {} },
          { key: "contract", label: "Promise — empty", filled: false, style: {} },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-facet]")).toHaveLength(2);
    expect(screen.getByText("2/7")).toBeInTheDocument();
  });

  it("states the status in plain text", () => {
    render(
      <Seal containerStyle={{}} countStyle={{}} count="0/7" label="no facet filled" stripes={[]} />,
    );
    expect(screen.getByRole("img", { name: "no facet filled" })).toBeInTheDocument();
  });
});

describe("Unit tests for withSealLogic", () => {
  it("always shows seven stripes", () => {
    const { container } = render(<SealWithLogic present={{}} />);
    expect(container.querySelectorAll("[data-facet]")).toHaveLength(7);
  });

  it("counts the filled facets", () => {
    render(<SealWithLogic present={{ intent: true, contract: true, lineage: true }} />);
    expect(screen.getByText("3/7")).toBeInTheDocument();
  });

  it("names the filled facets in plain text", () => {
    render(<SealWithLogic present={{ intent: true }} />);
    expect(screen.getByRole("img", { name: "1 of 7 facets filled: Purpose" })).toBeInTheDocument();
  });

  it("says so when no facet is filled", () => {
    render(<SealWithLogic present={{}} />);
    expect(screen.getByRole("img", { name: "no facet filled" })).toBeInTheDocument();
  });

  it("draws empty facets as an outline", () => {
    const { container } = render(<SealWithLogic present={{ intent: true }} />);
    expect(container.querySelector('[data-facet="contract"]')).toHaveStyle({
      background: "transparent",
    });
    expect(container.querySelector('[data-facet="intent"]')).toHaveStyle({
      background: "var(--ink)",
    });
  });

  it("reads the filling from a record", () => {
    render(<SealWithLogic record={{ present: { intent: true, contract: true } }} />);
    expect(screen.getByText("2/7")).toBeInTheDocument();
  });

  it("hides the count for rows", () => {
    render(<SealWithLogic present={{ intent: true }} hideCount />);
    expect(screen.getByText("1/7")).toHaveStyle({ display: "none" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withSealLogic(Seal).displayName).toBe("withSealLogic(Seal)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<SealWithLogic present={{ intent: true }} />);
    expect(
      screen.getByRole("img", { name: "1 von 7 Facetten befüllt: Zweck" }),
    ).toBeInTheDocument();
    expect(screen.getByTitle("Zweck — befüllt")).toBeInTheDocument();
  });
});

describe("Snapshot tests for Seal", () => {
  it("partially filled", () => {
    const { container } = render(
      <SealWithLogic present={{ intent: true, contract: true, verification: true }} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("empty", () => {
    const { container } = render(<SealWithLogic present={{}} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
