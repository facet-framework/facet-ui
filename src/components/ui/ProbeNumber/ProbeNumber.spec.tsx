import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/ProbeNumber/ProbeNumber.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProbeNumberWithLogic, { ProbeNumber, withProbeNumberLogic } from ".";

describe("Unit tests for ProbeNumber", () => {
  it("renders a toggle with a readable label", () => {
    render(
      <ProbeNumber computedStyle={{}} expanded={false} label="16 offene Punkte anzeigen">
        16
      </ProbeNumber>,
    );
    const button = screen.getByRole("button", { name: "16 offene Punkte anzeigen" });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("reports the open state", () => {
    render(
      <ProbeNumber computedStyle={{}} expanded label={localized.text3}>
        2
      </ProbeNumber>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("supports disabling", () => {
    render(
      <ProbeNumber computedStyle={{}} expanded={false} label={localized.text5} disabled>
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
      <ProbeNumberWithLogic probeKey="open" label="offene Punkte" onToggle={onToggle}>
        16
      </ProbeNumberWithLogic>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith("open");
  });

  it("closes an already open probe", async () => {
    const onToggle = jest.fn();
    render(
      <ProbeNumberWithLogic
        probeKey="open"
        activeProbe="open"
        label="offene Punkte"
        onToggle={onToggle}
      >
        16
      </ProbeNumberWithLogic>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(null);
  });

  it("handles a missing callback", async () => {
    render(
      <ProbeNumberWithLogic probeKey="open" label="offene Punkte">
        16
      </ProbeNumberWithLogic>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("emphasizes the active probe", () => {
    const { rerender } = render(
      <ProbeNumberWithLogic probeKey="open" label={localized.text16}>
        16
      </ProbeNumberWithLogic>,
    );
    expect(screen.getByRole("button")).toHaveStyle({
      borderBottomWidth: "1px",
      borderBottomColor: "var(--sig-mid)",
    });
    rerender(
      <ProbeNumberWithLogic probeKey="open" activeProbe="open" label={localized.text19}>
        16
      </ProbeNumberWithLogic>,
    );
    expect(screen.getByRole("button")).toHaveStyle({
      borderBottomWidth: "2px",
      borderBottomColor: "var(--signal)",
    });
  });

  it("supports keyboard focus", async () => {
    const onToggle = jest.fn();
    render(
      <ProbeNumberWithLogic probeKey="deadline" label={remainingText.text148} onToggle={onToggle}>
        2
      </ProbeNumberWithLogic>,
    );
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledWith("deadline");
  });

  it("sets a descriptive displayName", () => {
    expect(withProbeNumberLogic(ProbeNumber).displayName).toBe("withProbeNumberLogic(ProbeNumber)");
  });
});

describe("Snapshot tests for ProbeNumber", () => {
  it("compact", () => {
    const { container } = render(
      <ProbeNumberWithLogic probeKey="open" label={localized.text23}>
        16
      </ProbeNumberWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("open", () => {
    const { container } = render(
      <ProbeNumberWithLogic probeKey="open" activeProbe="open" label={localized.text27}>
        16
      </ProbeNumberWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
