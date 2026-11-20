import { labelText } from "../../../i18n/legacy/labels";
import { fireEvent, render, screen } from "@testing-library/react";
import MarkWithLogic, { Mark, withMarkLogic } from ".";

describe("Unit tests for Mark", () => {
  it("renders the static mark as a labeled image", () => {
    render(
      <Mark
        size={20}
        viewBoxWidth={100}
        viewBoxHeight={100}
        bars={[{ key: "a", x: 0, y: 0, width: 44, height: 78, fill: "#111318" }]}
        label="Facet Atlas"
        interactive={false}
        wrapperStyle={{}}
      />,
    );
    expect(screen.getByRole("img", { name: "Facet Atlas" })).toBeInTheDocument();
  });

  it("becomes a button with the same label when interactive", () => {
    const onClick = jest.fn();
    render(
      <Mark
        size={20}
        viewBoxWidth={158}
        viewBoxHeight={100}
        bars={[]}
        label={labelText.text326}
        interactive
        wrapperStyle={{}}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labelText.text326 }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calculates height from the field's aspect ratio", () => {
    const { container } = render(
      <Mark
        size={158}
        viewBoxWidth={158}
        viewBoxHeight={100}
        bars={[]}
        label="Facet Atlas"
        interactive={false}
        wrapperStyle={{}}
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "158");
    expect(svg).toHaveAttribute("height", "100");
  });

  it("gives each bar its animation identifier", () => {
    const { container } = render(
      <Mark
        size={20}
        viewBoxWidth={158}
        viewBoxHeight={100}
        bars={[
          { key: "a", x: 0, y: 11, width: 22, height: 78, fill: "#111318", animationKey: "load-1" },
        ]}
        label="Facet Atlas"
        interactive={false}
        wrapperStyle={{}}
      />,
    );
    expect(container.querySelector("rect")).toHaveAttribute("data-facet-mark-bar", "load-1");
  });
});

describe("Unit tests for withMarkLogic", () => {
  it("shows two static bars by default", () => {
    const { container } = render(<MarkWithLogic />);
    expect(container.querySelectorAll("rect")).toHaveLength(2);
    expect(container.querySelector("[data-facet-mark-bar]")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Facet Atlas" })).toBeInTheDocument();
  });

  it("splits into five bars while loading", () => {
    const { container } = render(<MarkWithLogic variant="loading" />);
    const bars = container.querySelectorAll("[data-facet-mark-bar]");
    expect(bars).toHaveLength(5);
    expect(bars[0]).toHaveAttribute("data-facet-mark-bar", "load-1");
    expect(bars[4]).toHaveAttribute("data-facet-mark-bar", "load-5");
  });

  it("replays the brand animation when clicked", () => {
    const { container } = render(<MarkWithLogic variant="brand" />);
    const before = container.querySelector("svg");
    expect(container.querySelectorAll("[data-facet-mark-bar^='open-']")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button"));

    const after = container.querySelector("svg");

    expect(after).not.toBe(before);
  });

  it("accepts a custom size, label and style", () => {
    const { container } = render(
      <MarkWithLogic size={40} label="Atlas" style={{ opacity: 0.5 }} />,
    );
    expect(container.querySelector("svg")).toHaveAttribute("width", "40");
    expect(screen.getByRole("img", { name: "Atlas" })).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveStyle({ opacity: "0.5" });
  });

  it("uses the static mark with reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<MarkWithLogic variant="loading" data-testid={"quiet"} />);
    expect(container.querySelectorAll("rect")).toHaveLength(2);
    expect(container.querySelector("[data-facet-mark-bar]")).not.toBeInTheDocument();

    window.matchMedia = original;
  });

  it("sets a descriptive displayName", () => {
    expect(withMarkLogic(Mark).displayName).toBe("withMarkLogic(Mark)");
  });
});

describe("Snapshot tests for Mark", () => {
  it("idle", () => {
    const { container } = render(<MarkWithLogic />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Loading animation", () => {
    const { container } = render(<MarkWithLogic variant="loading" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Brand animation", () => {
    const { container } = render(<MarkWithLogic variant="brand" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
