import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/Kbd/Kbd.spec.text";
import { render, screen } from "@testing-library/react";
import KbdWithLogic, { Kbd, withKbdLogic } from ".";

describe("Unit tests for Kbd", () => {
  it("shows the shortcut", () => {
    render(<Kbd computedStyle={{}} keys="⌘K" label={labelText.text330} />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("outlines empty facets", () => {
    render(<Kbd computedStyle={{}} keys="Esc" label="Escape" />);
    expect(screen.getByLabelText("Escape")).toBeInTheDocument();
  });
});

describe("Unit tests for withKbdLogic", () => {
  it("translates special keys into spoken names", () => {
    render(<KbdWithLogic keys="⌘K" />);
    expect(screen.getByLabelText(labelText.text330)).toBeInTheDocument();
  });

  it("combines key sequences", () => {
    render(<KbdWithLogic keys={["→", "←"]} />);
    expect(screen.getByText("→ ←")).toBeInTheDocument();
    expect(screen.getByLabelText("Pfeil rechts Pfeil links")).toBeInTheDocument();
  });

  it("accepts a custom accessible label", () => {
    render(<KbdWithLogic keys="R" label={localized.text5} />);
    expect(screen.getByLabelText(localized.text6)).toBeInTheDocument();
  });

  it("bricht nie um", () => {
    render(<KbdWithLogic keys="⌘K" data-testid="kbd" />);
    expect(screen.getByTestId("kbd")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("sets a descriptive displayName", () => {
    expect(withKbdLogic(Kbd).displayName).toBe("withKbdLogic(Kbd)");
  });
});

describe("Snapshot tests for Kbd", () => {
  it("search shortcut", () => {
    const { container } = render(<KbdWithLogic keys="⌘K" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Key sequence", () => {
    const { container } = render(<KbdWithLogic keys={["→", "←"]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
