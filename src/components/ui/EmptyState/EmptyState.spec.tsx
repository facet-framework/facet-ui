import { render, screen } from "@testing-library/react";
import EmptyStateWithLogic, { EmptyState, withEmptyStateLogic } from ".";

const styles = { containerStyle: {}, headlineStyle: {}, bodyStyle: {} };

describe("Unit tests for EmptyState", () => {
  it("names what is missing", () => {
    render(<EmptyState {...styles} headline="No task described." />);
    expect(screen.getByRole("status")).toHaveTextContent("No task described.");
  });

  it("explains the consequence on request", () => {
    render(<EmptyState {...styles} headline="No task." body="Nothing to back." />);
    expect(screen.getByText("Nothing to back.")).toBeInTheDocument();
  });

  it("copes without a consequence sentence", () => {
    const { container } = render(<EmptyState {...styles} headline="Empty." />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("accepts a way forward", () => {
    render(<EmptyState {...styles} headline="Empty." action={<button>create</button>} />);
    expect(screen.getByRole("button", { name: "create" })).toBeInTheDocument();
  });
});

describe("Unit tests for withEmptyStateLogic", () => {
  it("is muted by default", () => {
    render(<EmptyStateWithLogic headline="Nothing open." />);
    expect(screen.getByText("Nothing open.")).toHaveStyle({ color: "var(--dim)" });
  });

  it("gives open points ink", () => {
    render(<EmptyStateWithLogic tone="open" headline="No entry point in code." />);
    expect(screen.getByText("No entry point in code.")).toHaveStyle({ color: "var(--ink)" });
  });

  it("sets the consequence sentence in mono", () => {
    render(<EmptyStateWithLogic headline="Empty." body="Consequence." />);
    expect(screen.getByText("Consequence.")).toHaveStyle({ fontFamily: "var(--font-mono)" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withEmptyStateLogic(EmptyState).displayName).toBe("withEmptyStateLogic(EmptyState)");
  });
});

describe("Snapshot tests for EmptyState", () => {
  it("quiet", () => {
    const { container } = render(
      <EmptyStateWithLogic headline="No task described." body="Nothing to back." />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("open point", () => {
    const { container } = render(
      <EmptyStateWithLogic tone="open" headline="No entry point in code." />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
