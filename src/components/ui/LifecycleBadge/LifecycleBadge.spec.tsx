import { render, screen } from "@testing-library/react";
import LifecycleBadgeWithLogic, { LifecycleBadge, withLifecycleBadgeLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const styles = { containerStyle: {}, markStyle: {}, labelStyle: {}, ageStyle: {} };

describe("Unit tests for LifecycleBadge", () => {
  it("shows state and age", () => {
    render(<LifecycleBadge {...styles} label="active" age="197 d" title="active · for 197 days" />);
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("197 d")).toBeInTheDocument();
  });

  it("leaves out the age when there is none", () => {
    const { container } = render(
      <LifecycleBadge {...styles} label="planned" age="" title="planned" />,
    );
    expect(container.querySelectorAll("span")).toHaveLength(3);
  });
});

describe("Unit tests for withLifecycleBadgeLogic", () => {
  const today = new Date("2026-07-30");

  it("translates the state into German under the German locale", () => {
    render(<LifecycleBadgeWithLogic lifecycle="deprecated" />);
    expect(screen.getByText("deprecated")).toBeInTheDocument();
  });

  it("computes the days in the state", () => {
    render(<LifecycleBadgeWithLogic lifecycle="active" createdAt="2026-07-01" today={today} />);
    expect(screen.getByText("29 d")).toBeInTheDocument();
  });

  it("works without a date", () => {
    render(<LifecycleBadgeWithLogic lifecycle="active" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveAttribute("title", "active");
  });

  it("ignores an unreadable date", () => {
    render(<LifecycleBadgeWithLogic lifecycle="active" createdAt="no date" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveAttribute("title", "active");
  });

  it("names the replacement in plain text", () => {
    render(
      <LifecycleBadgeWithLogic
        lifecycle="deprecated"
        supersededBy="sync/conflict/crdt-merge"
        data-testid="badge"
      />,
    );
    expect(screen.getByTestId("badge")).toHaveAttribute(
      "title",
      "deprecated · superseded by sync/conflict/crdt-merge",
    );
  });

  it("additionally encodes the state through the shape", () => {
    const { container, rerender } = render(<LifecycleBadgeWithLogic lifecycle="planned" />);
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({
      background: "transparent",
    });
    rerender(<LifecycleBadgeWithLogic lifecycle="deprecated" />);
    expect((container.firstChild as HTMLElement).firstChild).toHaveStyle({ height: "2px" });
  });

  it("returns unknown states unchanged", () => {
    render(<LifecycleBadgeWithLogic lifecycle="experimental" />);
    expect(screen.getByText("experimental")).toBeInTheDocument();
  });

  it("gives a meaningful displayName", () => {
    expect(withLifecycleBadgeLogic(LifecycleBadge).displayName).toBe(
      "withLifecycleBadgeLogic(LifecycleBadge)",
    );
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    const today = new Date("2026-07-30");
    renderInGerman(
      <LifecycleBadgeWithLogic
        lifecycle="deprecated"
        createdAt="2026-07-01"
        today={today}
        supersededBy="sync/conflict/crdt-merge"
        data-testid="badge"
      />,
    );
    expect(screen.getByText("abgelöst")).toBeInTheDocument();
    expect(screen.getByText("29 T")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toHaveAttribute(
      "title",
      "abgelöst · seit 29 Tagen · abgelöst von sync/conflict/crdt-merge",
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

  it("planned", () => {
    const { container } = render(<LifecycleBadgeWithLogic lifecycle="planned" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
