import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrailWithLogic, { Trail, withTrailLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

describe("Unit tests for Trail", () => {
  it("renders the trail as navigation", () => {
    render(
      <Trail
        containerStyle={{}}
        separatorStyle={{}}
        label="Track"
        steps={[{ key: "a", label: "Overview", current: true, style: {} }]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Track" })).toBeInTheDocument();
  });

  it("marks the current step", () => {
    render(
      <Trail
        containerStyle={{}}
        separatorStyle={{}}
        label="Track"
        steps={[{ key: "a", label: "Quick add", current: true, style: {} }]}
      />,
    );
    expect(screen.getByText("Quick add")).toHaveAttribute("aria-current", "step");
  });

  it("turns earlier steps into buttons", () => {
    render(
      <Trail
        containerStyle={{}}
        separatorStyle={{}}
        label="Track"
        steps={[
          { key: "a", label: "Overview", current: false, style: {}, onClick: jest.fn() },
          { key: "b", label: "Quick add", current: true, style: {} },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument();
  });
});

describe("Unit tests for withTrailLogic", () => {
  const steps = [
    { key: "overview", label: "Overview", onSelect: jest.fn() },
    { key: "record", label: "Quick add" },
  ];

  it("treats the last step as the location", () => {
    render(<TrailWithLogic steps={steps} />);
    expect(screen.getByText("Quick add")).toHaveAttribute("aria-current", "step");
  });

  it("reports the way back", async () => {
    const onSelect = jest.fn();
    render(
      <TrailWithLogic
        steps={[{ key: "overview", label: "Overview", onSelect }, ...steps.slice(1)]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("puts separators between the steps", () => {
    render(<TrailWithLogic steps={steps} />);
    expect(screen.getAllByText("·")).toHaveLength(1);
  });

  it("copes with a single step", () => {
    render(<TrailWithLogic steps={[{ key: "overview", label: "Overview" }]} />);
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });

  it("keeps the steps on one line", () => {
    render(<TrailWithLogic steps={steps} />);
    expect(screen.getByText("Quick add")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("accepts a custom label", () => {
    render(<TrailWithLogic steps={steps} label="Way back" />);
    expect(screen.getByRole("navigation", { name: "Way back" })).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withTrailLogic(Trail).displayName).toBe("withTrailLogic(Trail)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<TrailWithLogic steps={[{ key: "overview", label: "Overview" }]} />);
    expect(
      screen.getByRole("navigation", { name: germanText.t("elements.trail.label") }),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for Trail", () => {
  it("three steps", () => {
    const { container } = render(
      <TrailWithLogic
        steps={[
          { key: "overview", label: "Overview", onSelect: () => {} },
          { key: "register", label: "Register", onSelect: () => {} },
          { key: "record", label: "Quick add" },
        ]}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("one step", () => {
    const { container } = render(
      <TrailWithLogic steps={[{ key: "overview", label: "Overview" }]} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
