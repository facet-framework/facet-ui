import { labelText } from "../../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Bar/Bar.spec.text";
import { render, screen } from "@testing-library/react";
import BarWithLogic, { Bar, withBarLogic } from ".";

describe("Unit tests for Bar", () => {
  it("exposes progress with a readable label", () => {
    render(<Bar trackStyle={{}} fillStyle={{}} label={germanLabels.text154} percent={82} />);
    const bar = screen.getByRole("progressbar", { name: germanLabels.text154 });
    expect(bar).toHaveAttribute("aria-valuenow", "82");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("draws the fill inside the track", () => {
    const { container } = render(
      <Bar
        trackStyle={{ height: 3 }}
        fillStyle={{ width: "50%" }}
        label={localized.text3}
        percent={50}
      />,
    );
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({ width: "50%" });
  });
});

describe("Unit tests for withBarLogic", () => {
  it("prioritizes open entry points", () => {
    render(<BarWithLogic value={31} total={38} label={labelText.text335} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "82");
  });

  it("stays at zero without a total", () => {
    render(<BarWithLogic value={5} total={0} label={localized.text5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("clamps values above the total", () => {
    render(<BarWithLogic value={9} total={4} label={labelText.extra24} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("colors full coverage as proven", () => {
    const { container } = render(<BarWithLogic value={4} total={4} label={labelText.text336} />);
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({
      background: "var(--ok)",
    });
  });

  it("allows automatic coloring to be disabled", () => {
    const { container } = render(
      <BarWithLogic value={4} total={4} autoComplete={false} label={labelText.text336} />,
    );
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({
      background: "var(--signal)",
    });
  });

  it("accepts a custom height", () => {
    const { container } = render(
      <BarWithLogic value={1} total={2} height={6} label={labelText.extra25} />,
    );
    expect(container.firstChild).toHaveStyle({ height: "6px" });
  });

  it("sets a descriptive displayName", () => {
    expect(withBarLogic(Bar).displayName).toBe("withBarLogic(Bar)");
  });
});

describe("Snapshot tests for Bar", () => {
  it("enters from the right", () => {
    const { container } = render(<BarWithLogic value={31} total={38} label={labelText.text335} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("fully proven", () => {
    const { container } = render(<BarWithLogic value={4} total={4} label={labelText.text336} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
