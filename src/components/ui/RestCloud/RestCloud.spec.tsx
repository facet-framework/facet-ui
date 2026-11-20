import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RestCloudWithLogic, { RestCloud, withRestCloudLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const items = Array.from({ length: 87 }, (_, index) => ({ id: `rest-${index}` }));

describe("Unit tests for RestCloud", () => {
  it("renders one stroke per entry", () => {
    const { container } = render(
      <RestCloud
        containerStyle={{}}
        stripStyle={{}}
        labelStyle={{}}
        ticks={[
          { key: "a", background: "var(--ink)", flexGrow: 1 },
          { key: "b", background: "var(--signal)", flexGrow: 1 },
        ]}
        label="2 more lines — expand"
        expanded={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(container.querySelectorAll("[data-tick]")).toHaveLength(2);
  });

  it("reports the state in plain text", () => {
    render(
      <RestCloud
        containerStyle={{}}
        stripStyle={{}}
        labelStyle={{}}
        ticks={[]}
        label="87 more lines — expand"
        expanded={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    const node = screen.getByRole("button", { name: "87 more lines — expand" });
    expect(node).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Unit tests for withRestCloudLogic", () => {
  it("draws one stroke per entry as long as the set stays small", () => {
    const { container } = render(<RestCloudWithLogic items={items.slice(0, 40)} />);
    expect(container.querySelectorAll("[data-tick]")).toHaveLength(40);
  });

  it("bundles very large sets", () => {
    const many = Array.from({ length: 480 }, (_, index) => ({ id: `r-${index}` }));
    const { container } = render(<RestCloudWithLogic items={many} maxTicks={60} />);
    expect(container.querySelectorAll("[data-tick]")).toHaveLength(60);
  });

  it("colours strokes by meaning", () => {
    const { container } = render(
      <RestCloudWithLogic items={[{ id: "a", meaning: "due" }, { id: "b" }]} />,
    );
    expect(container.querySelector('[data-tick="a"]')).toHaveStyle({ background: "var(--due)" });
  });

  it("uses the right grammatical number", () => {
    const { rerender } = render(<RestCloudWithLogic items={[{ id: "a" }]} />);
    expect(screen.getByRole("button", { name: /1 further entry/ })).toBeInTheDocument();
    rerender(<RestCloudWithLogic items={items} />);
    expect(screen.getByRole("button", { name: /87 further entries/ })).toBeInTheDocument();
  });

  it("accepts custom words", () => {
    render(<RestCloudWithLogic items={items} noun={["further line", "further lines"]} />);
    expect(screen.getByRole("button", { name: /87 further lines/ })).toBeInTheDocument();
  });

  it("reports expanding", async () => {
    const onToggle = jest.fn();
    render(<RestCloudWithLogic items={items} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("reports collapsing", async () => {
    const onToggle = jest.fn();
    render(<RestCloudWithLogic items={items} expanded onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("is operable by keyboard", async () => {
    const onToggle = jest.fn();
    render(<RestCloudWithLogic items={items} onToggle={onToggle} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("flattens the strip when expanding", () => {
    const { container, rerender } = render(<RestCloudWithLogic items={items} />);
    const strip = () => (container.firstChild as HTMLElement).firstChild;
    expect(strip()).toHaveStyle({ height: "9px" });
    rerender(<RestCloudWithLogic items={items} expanded />);
    expect(strip()).toHaveStyle({ height: "3px" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withRestCloudLogic(RestCloud).displayName).toBe("withRestCloudLogic(RestCloud)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    const { rerender } = renderInGerman(<RestCloudWithLogic items={[{ id: "a" }]} />);
    expect(
      screen.getByRole("button", { name: "1 weiterer Eintrag — aufklappen" }),
    ).toBeInTheDocument();
    rerender(<RestCloudWithLogic items={items} expanded />);
    expect(
      screen.getByRole("button", { name: "87 weitere Einträge — einklappen" }),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for RestCloud", () => {
  it("collapsed", () => {
    const { container } = render(<RestCloudWithLogic items={items.slice(0, 8)} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("expanded", () => {
    const { container } = render(<RestCloudWithLogic items={items.slice(0, 8)} expanded />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
