import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/LifecycleBadge/LifecycleBadge.spec.text";
import { render, screen } from "@testing-library/react";
import LifecycleBadgeWithLogic, { LifecycleBadge, withLifecycleBadgeLogic } from ".";

const styles = { containerStyle: {}, markStyle: {}, labelStyle: {}, ageStyle: {} };

describe("Unit tests for LifecycleBadge", () => {
  it("shows the lifecycle and its age", () => {
    render(
      <LifecycleBadge
        {...styles}
        label={remainingText.text7}
        age="197 T"
        title={remainingText.text119}
      />,
    );
    expect(screen.getByText(remainingText.text7)).toBeInTheDocument();
    expect(screen.getByText("197 T")).toBeInTheDocument();
  });

  it("omits age when unavailable", () => {
    const { container } = render(
      <LifecycleBadge
        {...styles}
        label={remainingText.text23}
        age=""
        title={remainingText.text23}
      />,
    );
    expect(container.querySelectorAll("span")).toHaveLength(3);
  });
});

describe("Unit tests for withLifecycleBadgeLogic", () => {
  const today = new Date("2026-07-30");

  it("translates lifecycle labels into German", () => {
    render(<LifecycleBadgeWithLogic lifecycle="deprecated" />);
    expect(screen.getByText(localized.text4)).toBeInTheDocument();
  });

  it("calculates days in the current lifecycle", () => {
    render(<LifecycleBadgeWithLogic lifecycle="active" createdAt="2026-07-01" today={today} />);
    expect(screen.getByText("29 T")).toBeInTheDocument();
  });

  it("handles a missing date", () => {
    render(<LifecycleBadgeWithLogic lifecycle="active" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveAttribute("title", remainingText.text7);
  });

  it("ignores unreadable dates", () => {
    render(
      <LifecycleBadgeWithLogic
        lifecycle="active"
        createdAt={localized.text8}
        data-testid="badge"
      />,
    );
    expect(screen.getByTestId("badge")).toHaveAttribute("title", remainingText.text7);
  });

  it("names the superseding record", () => {
    render(
      <LifecycleBadgeWithLogic
        lifecycle="deprecated"
        supersededBy="sync/conflict/crdt-merge"
        data-testid="badge"
      />,
    );
    expect(screen.getByTestId("badge")).toHaveAttribute("title", localized.text10);
  });

  it("also encodes lifecycle through shape", () => {
    const { container, rerender } = render(<LifecycleBadgeWithLogic lifecycle="planned" />);
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({
      background: "transparent",
    });
    rerender(<LifecycleBadgeWithLogic lifecycle="deprecated" />);
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({ height: "2px" });
  });

  it("preserves unknown lifecycle labels", () => {
    render(<LifecycleBadgeWithLogic lifecycle="experimental" />);
    expect(screen.getByText("experimental")).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withLifecycleBadgeLogic(LifecycleBadge).displayName).toBe(
      "withLifecycleBadgeLogic(LifecycleBadge)",
    );
  });
});

describe("Snapshot tests for LifecycleBadge", () => {
  it("active with age", () => {
    const { container } = render(
      <LifecycleBadgeWithLogic
        lifecycle="active"
        createdAt="2026-01-14"
        today={new Date("2026-07-30")}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("formats the rank with two digits", () => {
    const { container } = render(<LifecycleBadgeWithLogic lifecycle="planned" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
