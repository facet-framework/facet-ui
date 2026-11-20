import { render, screen } from "@testing-library/react";
import KbdWithLogic, { Kbd, withKbdLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

describe("Unit tests for Kbd", () => {
  it("shows the shortcut", () => {
    render(<Kbd computedStyle={{}} keys="⌘K" label="Command K" />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("names the spoken name", () => {
    render(<Kbd computedStyle={{}} keys="Esc" label="Escape" />);
    expect(screen.getByLabelText("Escape")).toBeInTheDocument();
  });
});

describe("Unit tests for withKbdLogic", () => {
  it("translates special keys into spoken names", () => {
    render(<KbdWithLogic keys="⌘K" />);
    expect(screen.getByLabelText("Command K")).toBeInTheDocument();
  });

  it("joins key sequences", () => {
    render(<KbdWithLogic keys={["→", "←"]} />);
    expect(screen.getByText("→ ←")).toBeInTheDocument();
    expect(screen.getByLabelText("Arrow right Arrow left")).toBeInTheDocument();
  });

  it("allows a custom plain text", () => {
    render(<KbdWithLogic keys="R" label="Open register" />);
    expect(screen.getByLabelText("Open register")).toBeInTheDocument();
  });

  it("never wraps", () => {
    render(<KbdWithLogic keys="⌘K" data-testid="kbd" />);
    expect(screen.getByTestId("kbd")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withKbdLogic(Kbd).displayName).toBe("withKbdLogic(Kbd)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German key names under the German locale", () => {
    renderInGerman(<KbdWithLogic keys={["⌘", "→"]} />);
    expect(screen.getByLabelText("Befehl Pfeil rechts")).toBeInTheDocument();
  });
});

describe("Snapshot tests for Kbd", () => {
  it("search shortcut", () => {
    const { container } = render(<KbdWithLogic keys="⌘K" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("key sequence", () => {
    const { container } = render(<KbdWithLogic keys={["→", "←"]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
