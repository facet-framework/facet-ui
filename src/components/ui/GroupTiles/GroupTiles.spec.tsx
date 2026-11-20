import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupTilesWithLogic, { GroupTiles, withGroupTilesLogic } from ".";
import { TextProvider } from "../../../facet/i18n";
import { renderInGerman } from "../../../facet/i18n/testing";

const groups = [
  { key: "tasks", label: "tasks", count: 3, meta: "3 features", proven: 4, total: 8 },
  { key: "sync", label: "sync", count: 2, meta: "2 features", proven: 5, total: 5 },
  { key: "lists", label: "lists", count: 2, meta: "2 features", proven: 0, total: 3 },
];

describe("Unit tests for GroupTiles", () => {
  it("says so when there is nothing to show", () => {
    render(
      <GroupTiles
        containerStyle={{}}
        gridStyle={{}}
        captionStyle={{}}
        tiles={[]}
        caption=""
        emptyText="Nothing to show."
      />,
    );
    expect(screen.getByText("Nothing to show.")).toBeInTheDocument();
  });
});

describe("Unit tests for withGroupTilesLogic", () => {
  it("reformats counts when the provider switches from English to the German locale", () => {
    const counted = [{ key: "tasks", label: "Tasks", count: 1000 }];
    const { rerender } = render(
      <TextProvider locale="en">
        <GroupTilesWithLogic groups={counted} />
      </TextProvider>,
    );
    expect(screen.getByText("1,000")).toBeInTheDocument();
    rerender(
      <TextProvider locale="de">
        <GroupTilesWithLogic groups={counted} />
      </TextProvider>,
    );
    expect(screen.getByText("1.000")).toBeInTheDocument();
    expect(screen.queryByText("1,000")).not.toBeInTheDocument();
  });

  it("gives every group a tile", () => {
    const { container } = render(<GroupTilesWithLogic groups={groups} />);
    expect(container.querySelectorAll("[data-tile]")).toHaveLength(3);
  });

  it("puts the largest group first", () => {
    const { container } = render(<GroupTilesWithLogic groups={groups} />);
    expect(container.querySelectorAll("[data-tile]")[0]).toHaveAttribute("data-tile", "tasks");
  });

  it("orders by name on equal counts, so the order is stable", () => {
    const { container } = render(<GroupTilesWithLogic groups={groups} />);
    const keys = Array.from(container.querySelectorAll("[data-tile]")).map((tile) =>
      tile.getAttribute("data-tile"),
    );
    expect(keys).toEqual(["tasks", "lists", "sync"]);
  });

  it("writes the share as a number next to the bar", () => {
    // A bar is the shape, not the statement.
    render(<GroupTilesWithLogic groups={groups} shareNoun="promises with a mapped test" />);
    expect(screen.getByText("4/8 promises with a mapped test · 50 %")).toBeInTheDocument();
  });

  it("names the bar with its group for screen readers", () => {
    render(<GroupTilesWithLogic groups={groups} shareNoun="promises with a mapped test" />);
    expect(
      screen.getByRole("progressbar", { name: "sync: 5 of 5 promises with a mapped test" }),
    ).toBeInTheDocument();
  });

  it("invents no share where nothing is measured", () => {
    render(
      <GroupTilesWithLogic
        groups={[
          { key: "ops", label: "ops", count: 1 },
          { key: "core", label: "core", count: 2, proven: 1, total: 4 },
        ]}
      />,
    );
    expect(screen.getByText("nothing measured")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
  });

  it("omits the share line where no group has anything to measure", () => {
    render(<GroupTilesWithLogic groups={[{ key: "ops", label: "ops", count: 1 }]} />);
    expect(screen.queryByText("nothing measured")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("counts across all tiles in the answer line", () => {
    render(<GroupTilesWithLogic groups={groups} noun="areas" unit="records" />);
    expect(screen.getByText("7 records in 3 areas.")).toBeInTheDocument();
  });

  it("opens a group when the caller offers it", async () => {
    const onOpen = jest.fn();
    render(<GroupTilesWithLogic groups={groups} onOpen={onOpen} />);
    await userEvent.click(screen.getByText("sync"));
    expect(onOpen).toHaveBeenCalledWith("sync");
  });

  it("is not a button without an open handler", () => {
    render(<GroupTilesWithLogic groups={groups} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withGroupTilesLogic(GroupTiles).displayName).toBe("withGroupTilesLogic(GroupTiles)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<GroupTilesWithLogic groups={groups} />);
    expect(screen.getByText("7 Records in 3 Gruppen.")).toBeInTheDocument();
    expect(screen.getByText("4/8 mit Testzuordnung · 50 %")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "sync: 5 von 5 mit Testzuordnung" }),
    ).toBeInTheDocument();
  });

  it("falls back to the English defaults", () => {
    render(<GroupTilesWithLogic groups={groups} />);
    expect(screen.getByText("7 records in 3 groups.")).toBeInTheDocument();
  });
});

describe("Snapshot tests for GroupTiles", () => {
  it("domains with coverage", () => {
    const { container } = render(
      <GroupTilesWithLogic groups={groups} noun="areas" shareNoun="promises with a mapped test" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
