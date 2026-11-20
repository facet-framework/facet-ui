import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DependencyFanWithLogic, { DependencyFan, withDependencyFanLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

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
  it("says so when nothing depends on anything else", () => {
    render(
      <DependencyFan
        containerStyle={{}}
        captionStyle={{}}
        emptyStyle={{}}
        groups={[]}
        caption=""
        emptyText="No record depends on another."
        upstreamLabel="depends on"
        downstreamLabel="carries"
      />,
    );
    expect(screen.getByText("No record depends on another.")).toBeInTheDocument();
  });
});

describe("Unit tests for withDependencyFanLogic", () => {
  it("lists every involved record exactly once", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);
    // Four records, although three edges name them six times.
    expect(container.querySelectorAll("[data-fan]")).toHaveLength(4);
  });

  it("fans out both directions", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);
    const row = container.querySelector('[data-fan="tasks/create/quick-add"]') as HTMLElement;

    // What it needs, and what needs it — in one row.
    expect(within(row).getByText("lists/core/list-store")).toBeInTheDocument();
    expect(within(row).getByText("sync/queue/offline-queue")).toBeInTheDocument();
    expect(within(row).getByText("search/fulltext/task-search")).toBeInTheDocument();
  });

  it("puts the roots at the top", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);
    const rows = Array.from(container.querySelectorAll("[data-fan]"));
    expect(rows[rows.length - 1]).toHaveAttribute("data-fan", "search/fulltext/task-search");
  });

  it("stays in a stable order without a depth", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} />);
    const ids = Array.from(container.querySelectorAll("[data-fan]")).map((row) =>
      row.getAttribute("data-fan"),
    );
    expect(ids).toEqual([...ids].sort());
  });

  it("names a reference without a record as such", () => {
    render(
      <DependencyFanWithLogic
        edges={[{ from: "does/not/exist", to: "tasks/create/quick-add" }]}
        ghosts={["does/not/exist"]}
      />,
    );
    // Colour alone would not carry the message.
    expect(screen.getAllByText("does/not/exist · no record").length).toBeGreaterThan(0);
  });

  it("counts the dangling references in the answer line", () => {
    render(
      <DependencyFanWithLogic
        edges={[{ from: "does/not/exist", to: "tasks/create/quick-add" }]}
        ghosts={["does/not/exist"]}
      />,
    );
    expect(screen.getByText(/1 reference points to an id without a record/)).toBeInTheDocument();
  });

  it("opens a record, but never a dangling reference", async () => {
    const onOpen = jest.fn();
    render(
      <DependencyFanWithLogic
        edges={[{ from: "does/not/exist", to: "tasks/create/quick-add" }]}
        ghosts={["does/not/exist"]}
        onOpen={onOpen}
      />,
    );

    await userEvent.click(screen.getAllByRole("button", { name: "tasks/create/quick-add" })[0]);
    expect(onOpen).toHaveBeenCalledWith("tasks/create/quick-add");

    // A dangling reference is not a button: the detail could show nothing.
    expect(screen.queryByRole("button", { name: /no record/ })).not.toBeInTheDocument();
  });

  it("accepts readable names where there are any", () => {
    render(
      <DependencyFanWithLogic
        edges={edges}
        labelOf={(id) => (id === "tasks/create/quick-add" ? "Quick add" : id)}
      />,
    );
    expect(screen.getAllByText("Quick add").length).toBeGreaterThan(0);
  });

  it("speaks German under the German locale", () => {
    renderInGerman(
      <DependencyFanWithLogic
        edges={[{ from: "does/not/exist", to: "tasks/create/quick-add" }]}
        ghosts={["does/not/exist"]}
      />,
    );
    expect(
      screen.getAllByText(`does/not/exist · ${germanText.t("elements.dependencyFan.noRecord")}`)
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(germanText.plural("elements.dependencyFan.ghostLinks", 1), { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(germanText.t("elements.dependencyFan.upstream")).length,
    ).toBeGreaterThan(0);
  });

  it("assigns a descriptive displayName", () => {
    expect(withDependencyFanLogic(DependencyFan).displayName).toBe(
      "withDependencyFanLogic(DependencyFan)",
    );
  });
});

describe("Snapshot tests for DependencyFan", () => {
  it("corpus graph", () => {
    const { container } = render(<DependencyFanWithLogic edges={edges} depth={depth} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
