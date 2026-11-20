import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/GroupTiles/GroupTiles.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupTilesWithLogic, { GroupTiles, withGroupTilesLogic } from ".";

const groups = [
  { key: "tasks", label: "tasks", count: 3, meta: "3 Kernfunktionen", proven: 4, total: 8 },
  { key: "sync", label: "sync", count: 2, meta: "2 Kernfunktionen", proven: 5, total: 5 },
  { key: "lists", label: "lists", count: 2, meta: "2 Kernfunktionen", proven: 0, total: 3 },
];

describe("Unit tests for GroupTiles", () => {
  it("reports when there is nothing to show", () => {
    render(
      <GroupTiles
        containerStyle={{}}
        gridStyle={{}}
        captionStyle={{}}
        tiles={[]}
        caption=""
        emptyText={germanLabels.text153}
      />,
    );
    expect(screen.getByText(germanLabels.text153)).toBeInTheDocument();
  });
});

describe("Unit tests for withGroupTilesLogic", () => {
  it("gives each group a tile", () => {
    const { container } = render(<GroupTilesWithLogic groups={groups} />);
    expect(container.querySelectorAll("[data-tile]")).toHaveLength(3);
  });

  it("places the largest group first", () => {
    const { container } = render(<GroupTilesWithLogic groups={groups} />);
    expect(container.querySelectorAll("[data-tile]")[0]).toHaveAttribute("data-tile", "tasks");
  });

  it("sorts equal counts by name for stable ordering", () => {
    const { container } = render(<GroupTilesWithLogic groups={groups} />);
    const keys = Array.from(container.querySelectorAll("[data-tile]")).map((tile) =>
      tile.getAttribute("data-tile"),
    );
    expect(keys).toEqual(["tasks", "lists", "sync"]);
  });

  it("renders the sentence as a paragraph", () => {
    render(<GroupTilesWithLogic groups={groups} shareNoun={localized.text5} />);
    expect(screen.getByText(localized.text6)).toBeInTheDocument();
  });

  it("names each progress bar for its group", () => {
    render(<GroupTilesWithLogic groups={groups} shareNoun={localized.text8} />);
    expect(screen.getByRole("progressbar", { name: localized.text9 })).toBeInTheDocument();
  });

  it("makes no share claim without a measurement", () => {
    render(
      <GroupTilesWithLogic
        groups={[
          { key: "ops", label: "ops", count: 1 },
          { key: "core", label: "core", count: 2, proven: 1, total: 4 },
        ]}
      />,
    );
    expect(screen.getByText("nichts gemessen")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
  });

  it("omits shares when no group has a measurement", () => {
    render(<GroupTilesWithLogic groups={[{ key: "ops", label: "ops", count: 1 }]} />);
    expect(screen.queryByText("nichts gemessen")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("counts all tiles in the summary", () => {
    render(<GroupTilesWithLogic groups={groups} noun={remainingText.text145} unit="Records" />);
    expect(screen.getByText(remainingText.text146)).toBeInTheDocument();
  });

  it("opens a group when a callback is supplied", async () => {
    const onOpen = jest.fn();
    render(<GroupTilesWithLogic groups={groups} onOpen={onOpen} />);
    await userEvent.click(screen.getByText("sync"));
    expect(onOpen).toHaveBeenCalledWith("sync");
  });

  it("is not a button without an open action", () => {
    render(<GroupTilesWithLogic groups={groups} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withGroupTilesLogic(GroupTiles).displayName).toBe("withGroupTilesLogic(GroupTiles)");
  });
});

describe("Snapshot tests for GroupTiles", () => {
  it("areas with coverage", () => {
    const { container } = render(
      <GroupTilesWithLogic
        groups={groups}
        noun={remainingText.text145}
        shareNoun={localized.text17}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
