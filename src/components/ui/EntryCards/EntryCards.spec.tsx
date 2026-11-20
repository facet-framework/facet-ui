import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/EntryCards/EntryCards.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EntryCardsWithLogic, { EntryCards } from ".";

const entries = [
  {
    key: "records",
    tag: "Records",
    title: localized.text1,
    value: "42",
    valueMeta: remainingText.text150,
    lead: localized.text2,
    action: localized.text3,
  },
  {
    key: "promises",
    tag: localized.text4,
    title: localized.text5,
    value: "68 %",
    valueMeta: "31/46 belegt",
    lead: localized.text6,
    action: localized.text7,
    open: true,
  },
];

function keys(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-entry]")).map((card) =>
    card.getAttribute("data-entry"),
  );
}

describe("Unit tests for EntryCards", () => {
  it("reports when there is nothing to show", () => {
    render(
      <EntryCards containerStyle={{}} gridStyle={{}} cards={[]} emptyText={germanLabels.text153} />,
    );
    expect(screen.getByText(germanLabels.text153)).toBeInTheDocument();
  });
});

describe("Unit tests for withEntryCardsLogic", () => {
  it("gives each entry point a surface", () => {
    const { container } = render(<EntryCardsWithLogic entries={entries} />);
    expect(container.querySelectorAll("[data-entry]")).toHaveLength(2);
  });

  it("exposes the final value from the start", () => {
    const { container } = render(<EntryCardsWithLogic entries={entries} />);
    expect(keys(container)).toEqual(["promises", "records"]);
  });

  it("preserves order when none is open", () => {
    const { container } = render(
      <EntryCardsWithLogic entries={entries.map((entry) => ({ ...entry, open: false }))} />,
    );
    expect(keys(container)).toEqual(["records", "promises"]);
  });

  it("marks the open entry without relying on color", () => {
    render(<EntryCardsWithLogic entries={entries} />);
    expect(screen.getByText(/▸/)).toBeInTheDocument();
  });

  it("shows the number and its source", () => {
    render(<EntryCardsWithLogic entries={entries} />);
    expect(screen.getByText("68 %")).toBeInTheDocument();
    expect(screen.getByText("31/46 belegt")).toBeInTheDocument();
  });

  it("accepts a custom illustration", () => {
    render(
      <EntryCardsWithLogic
        entries={[{ ...entries[0], figure: <i data-testid={"figure"}>{labelText.text92}</i> }]}
      />,
    );
    expect(screen.getByTestId("figure")).toBeInTheDocument();
  });

  it("remains informational without a handler", () => {
    render(<EntryCardsWithLogic entries={entries} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reports the clicked entry's key", async () => {
    const onOpen = jest.fn();
    render(<EntryCardsWithLogic entries={entries} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button", { name: localized.text16 }));
    expect(onOpen).toHaveBeenCalledWith("promises");
  });

  it("reports when there is no entry point", () => {
    render(<EntryCardsWithLogic entries={[]} emptyText={localized.text18} />);
    expect(screen.getByText(localized.text19)).toBeInTheDocument();
  });
});
