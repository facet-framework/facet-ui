import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/RestCloud/RestCloud.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RestCloudWithLogic, { RestCloud, withRestCloudLogic } from ".";

const items = Array.from({ length: 87 }, (_, index) => ({ id: `rest-${index}` }));

describe("Unit tests for RestCloud", () => {
  it("renders one mark per entry", () => {
    const { container } = render(
      <RestCloud
        containerStyle={{}}
        stripStyle={{}}
        labelStyle={{}}
        ticks={[
          { key: "a", background: "var(--ink)", flexGrow: 1 },
          { key: "b", background: "var(--signal)", flexGrow: 1 },
        ]}
        label={labelText.text427}
        expanded={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(container.querySelectorAll("[data-tick]")).toHaveLength(2);
  });

  it("describes the state in plain language", () => {
    render(
      <RestCloud
        containerStyle={{}}
        stripStyle={{}}
        labelStyle={{}}
        ticks={[]}
        label={labelText.text428}
        expanded={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    const node = screen.getByRole("button", { name: labelText.text428 });
    expect(node).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Unit tests for withRestCloudLogic", () => {
  it("draws individual marks for small collections", () => {
    const { container } = render(<RestCloudWithLogic items={items.slice(0, 40)} />);
    expect(container.querySelectorAll("[data-tick]")).toHaveLength(40);
  });

  it("groups very large collections", () => {
    const many = Array.from({ length: 480 }, (_, index) => ({ id: `r-${index}` }));
    const { container } = render(<RestCloudWithLogic items={many} maxTicks={60} />);
    expect(container.querySelectorAll("[data-tick]")).toHaveLength(60);
  });

  it("colors marks by meaning", () => {
    const { container } = render(
      <RestCloudWithLogic items={[{ id: "a", meaning: "deadline" }, { id: "b" }]} />,
    );
    expect(container.querySelector('[data-tick="a"]')).toHaveStyle({
      background: "var(--deadline)",
    });
  });

  it("gives the spoken name", () => {
    const { rerender } = render(<RestCloudWithLogic items={[{ id: "a" }]} />);
    expect(screen.getByRole("button", { name: localized.text6 })).toBeInTheDocument();
    rerender(<RestCloudWithLogic items={items} />);
    expect(screen.getByRole("button", { name: localized.text7 })).toBeInTheDocument();
  });

  it("accepts custom wording", () => {
    render(<RestCloudWithLogic items={items} noun={[labelText.text429, labelText.text430]} />);
    expect(screen.getByRole("button", { name: labelText.text431 })).toBeInTheDocument();
  });

  it("reports expansion", async () => {
    const onToggle = jest.fn();
    render(<RestCloudWithLogic items={items} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("reports collapse", async () => {
    const onToggle = jest.fn();
    render(<RestCloudWithLogic items={items} expanded onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("supports keyboard interaction", async () => {
    const onToggle = jest.fn();
    render(<RestCloudWithLogic items={items} onToggle={onToggle} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("flattens the strip while expanded", () => {
    const { container, rerender } = render(<RestCloudWithLogic items={items} />);
    const strip = () => (container.firstChild as HTMLElement).firstChild;
    expect(strip()).toHaveStyle({ height: "9px" });
    rerender(<RestCloudWithLogic items={items} expanded />);
    expect(strip()).toHaveStyle({ height: "3px" });
  });

  it("sets a descriptive displayName", () => {
    expect(withRestCloudLogic(RestCloud).displayName).toBe("withRestCloudLogic(RestCloud)");
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
