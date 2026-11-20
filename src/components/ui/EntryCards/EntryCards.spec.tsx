import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EntryCardsWithLogic, { EntryCards } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const entries = [
  {
    key: "records",
    tag: "Records",
    title: "What is described",
    value: "42",
    valueMeta: "28 active · 14 planned",
    lead: "Every record has a team.",
    action: "Open register",
  },
  {
    key: "promises",
    tag: "Promises",
    title: "Which tests are mapped",
    value: "68 %",
    valueMeta: "31/46 backed",
    lead: "15 promises have no test.",
    action: "Open promises",
    open: true,
  },
];

function keys(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-entry]")).map((card) =>
    card.getAttribute("data-entry"),
  );
}

describe("Unit tests for EntryCards", () => {
  it("says so when there is nothing to show", () => {
    render(
      <EntryCards containerStyle={{}} gridStyle={{}} cards={[]} emptyText="Nothing to show." />,
    );
    expect(screen.getByText("Nothing to show.")).toBeInTheDocument();
  });
});

describe("Unit tests for withEntryCardsLogic", () => {
  it("gives every entry a surface", () => {
    const { container } = render(<EntryCardsWithLogic entries={entries} />);
    expect(container.querySelectorAll("[data-entry]")).toHaveLength(2);
  });

  it("moves open entries to the front", () => {
    const { container } = render(<EntryCardsWithLogic entries={entries} />);
    expect(keys(container)).toEqual(["promises", "records"]);
  });

  it("keeps the order when nothing is open", () => {
    const { container } = render(
      <EntryCardsWithLogic entries={entries.map((entry) => ({ ...entry, open: false }))} />,
    );
    expect(keys(container)).toEqual(["records", "promises"]);
  });

  it("marks the open entry without colour too", () => {
    render(<EntryCardsWithLogic entries={entries} />);
    expect(screen.getByText(/▸/)).toBeInTheDocument();
  });

  it("shows the number and where the number comes from", () => {
    render(<EntryCardsWithLogic entries={entries} />);
    expect(screen.getByText("68 %")).toBeInTheDocument();
    expect(screen.getByText("31/46 backed")).toBeInTheDocument();
  });

  it("takes a custom drawing", () => {
    render(
      <EntryCardsWithLogic
        entries={[{ ...entries[0], figure: <i data-testid="figure">Bar</i> }]}
      />,
    );
    expect(screen.getByTestId("figure")).toBeInTheDocument();
  });

  it("stays information without a handler, not a button", () => {
    render(<EntryCardsWithLogic entries={entries} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reports the key of the clicked entry", async () => {
    const onOpen = jest.fn();
    render(<EntryCardsWithLogic entries={entries} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button", { name: /Which tests are mapped/ }));
    expect(onOpen).toHaveBeenCalledWith("promises");
  });

  it("falls back to the default empty text, in German under the German locale", () => {
    const { unmount } = render(<EntryCardsWithLogic entries={[]} />);
    expect(screen.getByText("Nothing to show.")).toBeInTheDocument();
    unmount();
    renderInGerman(<EntryCardsWithLogic entries={[]} />);
    expect(screen.getByText("Nichts zu zeigen.")).toBeInTheDocument();
  });

  it("says so when there is no entry", () => {
    render(<EntryCardsWithLogic entries={[]} emptyText="No record read yet." />);
    expect(screen.getByText("No record read yet.")).toBeInTheDocument();
  });
});
