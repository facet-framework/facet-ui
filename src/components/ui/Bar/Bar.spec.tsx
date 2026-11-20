import { render, screen } from "@testing-library/react";
import BarWithLogic, { Bar, withBarLogic } from ".";

describe("Unit tests for Bar", () => {
  it("announces itself as progress with plain text", () => {
    render(<Bar trackStyle={{}} fillStyle={{}} label="31 of 38 backed" percent={82} />);
    const bar = screen.getByRole("progressbar", { name: "31 of 38 backed" });
    expect(bar).toHaveAttribute("aria-valuenow", "82");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("draws the fill as a child of the track", () => {
    const { container } = render(
      <Bar trackStyle={{ height: 3 }} fillStyle={{ width: "50%" }} label="Half" percent={50} />,
    );
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({ width: "50%" });
  });
});

describe("Unit tests for withBarLogic", () => {
  it("computes the share in percent", () => {
    render(<BarWithLogic value={31} total={38} label="Coverage" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "82");
  });

  it("stays at zero without a reference total", () => {
    render(<BarWithLogic value={5} total={0} label="no reference" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("caps values above the reference total", () => {
    render(<BarWithLogic value={9} total={4} label="capped" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("colours a complete value as successful", () => {
    const { container } = render(<BarWithLogic value={4} total={4} label="full" />);
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({
      background: "var(--ok)",
    });
  });

  it("lets the automatic colouring be switched off", () => {
    const { container } = render(
      <BarWithLogic value={4} total={4} autoComplete={false} label="full" />,
    );
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({
      background: "var(--signal)",
    });
  });

  it("accepts a custom height", () => {
    const { container } = render(<BarWithLogic value={1} total={2} height={6} label="tall" />);
    expect(container.firstChild).toHaveStyle({ height: "6px" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withBarLogic(Bar).displayName).toBe("withBarLogic(Bar)");
  });
});

describe("Snapshot tests for Bar", () => {
  it("partially backed", () => {
    const { container } = render(<BarWithLogic value={31} total={38} label="Coverage" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("fully backed", () => {
    const { container } = render(<BarWithLogic value={4} total={4} label="full" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
