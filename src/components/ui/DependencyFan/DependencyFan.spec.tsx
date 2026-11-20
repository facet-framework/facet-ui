import { localized } from "../../../i18n/legacy/components/ui/DependencyFan/DependencyFan.spec.text";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DependencyFanWithLogic, { DependencyFan, withDependencyFanLogic } from ".";

const edges = [
  { from: "lists/core/list-store", to: "tasks/create/quick-add" },
  { from: "sync/queue/offline-queue", to: "tasks/create/quick-add" },
  { from: "tasks/create/quick-add", to: "search/fulltext/task-search" },
];

const depth = {
  "lists/core/list-store": 0,
  "sync/queue/offline-queue": 0,
  "tasks/create/quick-add": 1,
  "search/fulltext/task-search": 2,
};

describe("Unit tests for DependencyFan", () => {
  it("reports when there are no dependencies", () => {
    render(
      <DependencyFan
        containerStyle={{}}
        captionStyle={{}}
        emptyStyle={{}}
        groups={[]}
        caption=""
        emptyText={localized.text2}
        upstreamLabel={localized.text3}
        downstreamLabel={localized.text4}
      />,
    );
    expect(screen.getByText(localized.text5)).toBeInTheDocument();
  });
});

describe("Unit tests for withDependencyFanLogic", () => {
  it("lists each participating record once", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);

    expect(container.querySelectorAll("[data-fan]")).toHaveLength(4);
  });

  it("expands both directions", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);
    const row = container.querySelector('[data-fan="tasks/create/quick-add"]') as HTMLElement;

    expect(within(row).getByText("lists/core/list-store")).toBeInTheDocument();
    expect(within(row).getByText("sync/queue/offline-queue")).toBeInTheDocument();
    expect(within(row).getByText("search/fulltext/task-search")).toBeInTheDocument();
  });

  it("places roots at the top", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);
    const rows = Array.from(container.querySelectorAll("[data-fan]"));
    expect(rows[rows.length - 1]).toHaveAttribute("data-fan", "search/fulltext/task-search");
  });

  it("keeps a stable order without depth values", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} />);
    const ids = Array.from(container.querySelectorAll("[data-fan]")).map((row) =>
      row.getAttribute("data-fan"),
    );
    expect(ids).toEqual([...ids].sort());
  });

  it("identifies references without records", () => {
    render(
      <DependencyFanWithLogic
        edges={[{ from: localized.text11, to: "tasks/create/quick-add" }]}
        ghosts={[localized.text12]}
      />,
    );

    expect(screen.getAllByText(localized.text13).length).toBeGreaterThan(0);
  });

  it("counts unresolved references in the summary", () => {
    render(
      <DependencyFanWithLogic
        edges={[{ from: localized.text15, to: "tasks/create/quick-add" }]}
        ghosts={[localized.text16]}
      />,
    );
    expect(screen.getByText(localized.text17)).toBeInTheDocument();
  });

  it("opens records but never unresolved references", async () => {
    const onOpen = jest.fn();
    render(
      <DependencyFanWithLogic
        edges={[{ from: localized.text19, to: "tasks/create/quick-add" }]}
        ghosts={[localized.text20]}
        onOpen={onOpen}
      />,
    );

    await userEvent.click(screen.getAllByRole("button", { name: "tasks/create/quick-add" })[0]);
    expect(onOpen).toHaveBeenCalledWith("tasks/create/quick-add");

    expect(screen.queryByRole("button", { name: localized.text21 })).not.toBeInTheDocument();
  });

  it("accepts readable names when available", () => {
    render(
      <DependencyFanWithLogic
        edges={edges}
        labelOf={(id) => (id === "tasks/create/quick-add" ? "Quick add" : id)}
      />,
    );
    expect(screen.getAllByText("Quick add").length).toBeGreaterThan(0);
  });

  it("sets a descriptive displayName", () => {
    expect(withDependencyFanLogic(DependencyFan).displayName).toBe(
      "withDependencyFanLogic(DependencyFan)",
    );
  });
});

describe("Snapshot tests for DependencyFan", () => {
  it("Corpus graph", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
