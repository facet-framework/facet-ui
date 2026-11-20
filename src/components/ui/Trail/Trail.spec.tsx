import { labelText } from "../../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Trail/Trail.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrailWithLogic, { Trail, withTrailLogic } from ".";

describe("Unit tests for Trail", () => {
  it("renders the trail as navigation", () => {
    render(
      <Trail
        containerStyle={{}}
        separatorStyle={{}}
        label={labelText.text433}
        steps={[{ key: "a", label: germanLabels.text7, current: true, style: {} }]}
      />,
    );
    expect(screen.getByRole("navigation", { name: labelText.text433 })).toBeInTheDocument();
  });

  it("marks the current level", () => {
    render(
      <Trail
        containerStyle={{}}
        separatorStyle={{}}
        label={labelText.text433}
        steps={[{ key: "a", label: "Quick add", current: true, style: {} }]}
      />,
    );
    expect(screen.getByText("Quick add")).toHaveAttribute("aria-current", "step");
  });

  it("makes earlier levels buttons", () => {
    render(
      <Trail
        containerStyle={{}}
        separatorStyle={{}}
        label={labelText.text433}
        steps={[
          { key: "a", label: germanLabels.text7, current: false, style: {}, onClick: jest.fn() },
          { key: "b", label: "Quick add", current: true, style: {} },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: germanLabels.text7 })).toBeInTheDocument();
  });
});

describe("Unit tests for withTrailLogic", () => {
  const steps = [
    { key: "overview", label: germanLabels.text7, onSelect: jest.fn() },
    { key: "record", label: "Quick add" },
  ];

  it("treats the final level as the current place", () => {
    render(<TrailWithLogic steps={steps} />);
    expect(screen.getByText("Quick add")).toHaveAttribute("aria-current", "step");
  });

  it("reports backward navigation", async () => {
    const onSelect = jest.fn();
    render(
      <TrailWithLogic
        steps={[{ key: "overview", label: germanLabels.text7, onSelect }, ...steps.slice(1)]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: germanLabels.text7 }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("separates the levels", () => {
    render(<TrailWithLogic steps={steps} />);
    expect(screen.getAllByText("·")).toHaveLength(1);
  });

  it("handles a single level", () => {
    render(<TrailWithLogic steps={[{ key: "overview", label: germanLabels.text7 }]} />);
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });

  it("keeps levels on one line", () => {
    render(<TrailWithLogic steps={steps} />);
    expect(screen.getByText("Quick add")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("accepts a custom label", () => {
    render(<TrailWithLogic steps={steps} label={localized.text10} />);
    expect(screen.getByRole("navigation", { name: localized.text11 })).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withTrailLogic(Trail).displayName).toBe("withTrailLogic(Trail)");
  });
});

describe("Snapshot tests for Trail", () => {
  it("three levels", () => {
    const { container } = render(
      <TrailWithLogic
        steps={[
          { key: "overview", label: germanLabels.text7, onSelect: () => {} },
          { key: localized.text13, label: localized.text14, onSelect: () => {} },
          { key: "record", label: "Quick add" },
        ]}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("single level", () => {
    const { container } = render(
      <TrailWithLogic steps={[{ key: "overview", label: germanLabels.text7 }]} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
