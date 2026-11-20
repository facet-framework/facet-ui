import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/EmptyState/EmptyState.spec.text";
import { render, screen } from "@testing-library/react";
import EmptyStateWithLogic, { EmptyState, withEmptyStateLogic } from ".";

const styles = { containerStyle: {}, headlineStyle: {}, bodyStyle: {} };

describe("Unit tests for EmptyState", () => {
  it("names what is missing", () => {
    render(<EmptyState {...styles} headline={localized.text2} />);
    expect(screen.getByRole("status")).toHaveTextContent(localized.text3);
  });

  it("optionally explains the consequence", () => {
    render(<EmptyState {...styles} headline={localized.text5} body={germanLabels.text156} />);
    expect(screen.getByText(germanLabels.text156)).toBeInTheDocument();
  });

  it("handles a missing consequence", () => {
    const { container } = render(<EmptyState {...styles} headline={labelText.text344} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("accepts a next action", () => {
    render(
      <EmptyState
        {...styles}
        headline={labelText.text344}
        action={<button>{remainingText.text161}</button>}
      />,
    );
    expect(screen.getByRole("button", { name: remainingText.text161 })).toBeInTheDocument();
  });
});

describe("Unit tests for withEmptyStateLogic", () => {
  it("is muted by default", () => {
    render(<EmptyStateWithLogic headline={localized.text9} />);
    expect(screen.getByText(localized.text10)).toHaveStyle({ color: "var(--dim)" });
  });

  it("highlights open issues", () => {
    render(<EmptyStateWithLogic tone="open" headline={localized.text12} />);
    expect(screen.getByText(localized.text13)).toHaveStyle({ color: "var(--ink)" });
  });

  it("uses monospace for the consequence", () => {
    render(<EmptyStateWithLogic headline={labelText.text344} body={labelText.text345} />);
    expect(screen.getByText(labelText.text345)).toHaveStyle({ fontFamily: "var(--font-mono)" });
  });

  it("sets a descriptive displayName", () => {
    expect(withEmptyStateLogic(EmptyState).displayName).toBe("withEmptyStateLogic(EmptyState)");
  });
});

describe("Snapshot tests for EmptyState", () => {
  it("quiet", () => {
    const { container } = render(
      <EmptyStateWithLogic headline={localized.text17} body={germanLabels.text156} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("offener Punkt", () => {
    const { container } = render(<EmptyStateWithLogic tone="open" headline={localized.text18} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
