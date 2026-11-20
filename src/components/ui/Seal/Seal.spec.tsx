import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Seal/Seal.spec.text";
import { render, screen } from "@testing-library/react";
import SealWithLogic, { Seal, withSealLogic } from ".";

describe("Unit tests for Seal", () => {
  it("renders one strip per facet", () => {
    const { container } = render(
      <Seal
        containerStyle={{}}
        countStyle={{}}
        count="2/7"
        label={localized.text2}
        stripes={[
          { key: "intent", label: localized.text3, filled: true, style: {} },
          { key: "contract", label: germanLabels.text166, filled: false, style: {} },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-facet]")).toHaveLength(2);
    expect(screen.getByText("2/7")).toBeInTheDocument();
  });

  it("draws open issues as a ring", () => {
    render(
      <Seal containerStyle={{}} countStyle={{}} count="0/7" label={localized.text4} stripes={[]} />,
    );
    expect(screen.getByRole("img", { name: localized.text5 })).toBeInTheDocument();
  });
});

describe("Unit tests for withSealLogic", () => {
  it("always shows seven strips", () => {
    const { container } = render(<SealWithLogic present={{}} />);
    expect(container.querySelectorAll("[data-facet]")).toHaveLength(7);
  });

  it("counts filled facets", () => {
    render(<SealWithLogic present={{ intent: true, contract: true, lineage: true }} />);
    expect(screen.getByText("3/7")).toBeInTheDocument();
  });

  it("names filled facets in plain language", () => {
    render(<SealWithLogic present={{ intent: true }} />);
    expect(screen.getByRole("img", { name: localized.text9 })).toBeInTheDocument();
  });

  it("reports when no facet is filled", () => {
    render(<SealWithLogic present={{}} />);
    expect(screen.getByRole("img", { name: localized.text11 })).toBeInTheDocument();
  });

  it("filled", () => {
    const { container } = render(<SealWithLogic present={{ intent: true }} />);
    expect(container.querySelector('[data-facet="contract"]')).toHaveStyle({
      background: "transparent",
    });
    expect(container.querySelector('[data-facet="intent"]')).toHaveStyle({
      background: "var(--ink)",
    });
  });

  it("reads filled facets from a record", () => {
    render(<SealWithLogic record={{ present: { intent: true, contract: true } }} />);
    expect(screen.getByText("2/7")).toBeInTheDocument();
  });

  it("hides counts in rows", () => {
    render(<SealWithLogic present={{ intent: true }} hideCount />);
    expect(screen.getByText("1/7")).toHaveStyle({ display: "none" });
  });

  it("sets a descriptive displayName", () => {
    expect(withSealLogic(Seal).displayName).toBe("withSealLogic(Seal)");
  });
});

describe("Snapshot tests for Seal", () => {
  it("partially filled", () => {
    const { container } = render(
      <SealWithLogic present={{ intent: true, contract: true, verification: true }} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("describes the state transition", () => {
    const { container } = render(<SealWithLogic present={{}} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
