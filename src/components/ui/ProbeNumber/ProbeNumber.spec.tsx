import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProbeNumberWithLogic, { ProbeNumber, withProbeNumberLogic } from ".";

describe("Unit tests for ProbeNumber", () => {
  it("renders a toggle with plain-text labelling", () => {
    render(
      <ProbeNumber computedStyle={{}} expanded={false} label="Show 16 open points">
        16
      </ProbeNumber>,
    );
    const button = screen.getByRole("button", { name: "Show 16 open points" });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("reports the opened state", () => {
    render(
      <ProbeNumber computedStyle={{}} expanded label="open">
        2
      </ProbeNumber>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("can be disabled", () => {
    render(
      <ProbeNumber computedStyle={{}} expanded={false} label="open" disabled>
        0
      </ProbeNumber>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Unit tests for withProbeNumberLogic", () => {
  it("opens the probe on click", async () => {
    const onToggle = jest.fn();
    render(
      <ProbeNumberWithLogic probeKey="open" label="open points" onToggle={onToggle}>
        16
      </ProbeNumberWithLogic>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith("open");
  });

  it("closes the probe that is already open", async () => {
    const onToggle = jest.fn();
    render(
      <ProbeNumberWithLogic
        probeKey="open"
        activeProbe="open"
        label="open points"
        onToggle={onToggle}
      >
        16
      </ProbeNumberWithLogic>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(null);
  });

  it("works without a callback", async () => {
    render(
      <ProbeNumberWithLogic probeKey="open" label="open points">
        16
      </ProbeNumberWithLogic>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("emphasises the active probe more strongly", () => {
    const { rerender } = render(
      <ProbeNumberWithLogic probeKey="open" label="open">
        16
      </ProbeNumberWithLogic>,
    );
    expect(screen.getByRole("button")).toHaveStyle({
      borderBottomWidth: "1px",
      borderBottomColor: "var(--sig-mid)",
    });
    rerender(
      <ProbeNumberWithLogic probeKey="open" activeProbe="open" label="open">
        16
      </ProbeNumberWithLogic>,
    );
    expect(screen.getByRole("button")).toHaveStyle({
      borderBottomWidth: "2px",
      borderBottomColor: "var(--signal)",
    });
  });

  it("is reachable by keyboard", async () => {
    const onToggle = jest.fn();
    render(
      <ProbeNumberWithLogic probeKey="due" label="Deadlines" onToggle={onToggle}>
        2
      </ProbeNumberWithLogic>,
    );
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledWith("due");
  });

  it("gives a meaningful displayName", () => {
    expect(withProbeNumberLogic(ProbeNumber).displayName).toBe("withProbeNumberLogic(ProbeNumber)");
  });
});

describe("Snapshot tests for ProbeNumber", () => {
  it("closed", () => {
    const { container } = render(
      <ProbeNumberWithLogic probeKey="open" label="open">
        16
      </ProbeNumberWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("opened", () => {
    const { container } = render(
      <ProbeNumberWithLogic probeKey="open" activeProbe="open" label="open">
        16
      </ProbeNumberWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
