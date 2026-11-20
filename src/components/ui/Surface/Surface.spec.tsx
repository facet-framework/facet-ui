import { localized } from "../../../i18n/legacy/components/ui/Surface/Surface.spec.text";
import { render, screen } from "@testing-library/react";
import SurfaceWithLogic, { Surface, withSurfaceLogic } from ".";

describe("Unit tests for Surface", () => {
  it("forwards props", () => {
    render(<Surface computedStyle={{}}>{localized.text1}</Surface>);
    expect(screen.getByText(localized.text2)).toBeInTheDocument();
  });

  it("applies the computed style", () => {
    const { container } = render(<Surface computedStyle={{ background: "rgb(250, 250, 248)" }} />);
    expect(container.firstChild).toHaveStyle({ background: "rgb(250, 250, 248)" });
  });
});

describe("Unit tests for withSurfaceLogic", () => {
  it("uses the content surface by default", () => {
    const { container } = render(<SurfaceWithLogic />);
    expect(container.firstChild).toHaveStyle({ background: "var(--surface)" });
  });

  it("supports every tone", () => {
    const { container } = render(<SurfaceWithLogic tone="tint2" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--tint-2)" });
  });

  it("optionally omits the background", () => {
    const { container } = render(<SurfaceWithLogic tone="transparent" />);
    expect(container.firstChild).toHaveStyle({ background: "transparent" });
  });

  it("resolves padding tokens", () => {
    const { container } = render(<SurfaceWithLogic padding="s5" />);
    expect(container.firstChild).toHaveStyle({ padding: "var(--space-5)" });
  });

  it("places the hairline on exactly one edge", () => {
    const { container } = render(<SurfaceWithLogic edge="top" />);
    expect(container.firstChild).toHaveStyle({ borderTop: "1px solid var(--line)" });
  });

  it("replaces the left edge with a rail", () => {
    const { container } = render(<SurfaceWithLogic edge="left" rail="var(--plan)" />);
    expect(container.firstChild).toHaveStyle({ borderLeft: "2px solid var(--plan)" });
  });

  it("makes the surface scrollable", () => {
    const { container } = render(<SurfaceWithLogic scroll />);
    expect(container.firstChild).toHaveStyle({ overflowY: "auto" });
  });

  it("sets a descriptive displayName", () => {
    expect(withSurfaceLogic(Surface).displayName).toBe("withSurfaceLogic(Surface)");
  });
});

describe("Snapshot tests for Surface", () => {
  it("content surface", () => {
    const { container } = render(
      <SurfaceWithLogic padding="s4">{localized.text13}</SurfaceWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("active register row with a rail", () => {
    const { container } = render(<SurfaceWithLogic tone="tint2" rail="var(--signal)" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
