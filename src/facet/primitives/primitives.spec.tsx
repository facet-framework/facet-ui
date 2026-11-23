import { createText as createGermanText } from "../i18n/text";
import { useEffect, useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Icon, iconNames } from "./Icon";
import {
  Badge,
  Button,
  Chip,
  Dot,
  Field,
  IconButton,
  Kbd,
  SearchField,
  Segment,
  Switch,
  Tabs,
} from "./controls";
import {
  DepthDeck,
  Distribution,
  EmptyState,
  ErrorState,
  Finding,
  ListRow,
  Meter,
  Section,
  Skeleton,
  Metric,
  Surface,
} from "./display";
import {
  Collection,
  CollectionToolbar,
  DataTable,
  Pagination,
  SortHint,
  pageWindow,
} from "./collection";
import { Breadcrumbs, Dialog, Menu, Sheet, Tooltip, useMenuTrigger } from "./overlay";
import { Toast } from "./toast";
import { renderInGerman } from "../i18n/testing";

const germanText = createGermanText("de");

describe("Icon", () => {
  it("is decoration without a label and an image with one", () => {
    const { container } = render(<Icon name="back" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    render(<Icon name="offsetBlocks" label="Drift" className="x" />);
    expect(screen.getByRole("img", { name: "Drift" })).toBeInTheDocument();
  });

  it("draws at least one path for every name in the set", () => {
    for (const name of iconNames) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
      unmount();
    }
  });
});

describe("controls", () => {
  it("renders a button, a link button and an icon button with its name", async () => {
    const onClick = jest.fn();
    render(
      <>
        <Button
          variant="primary"
          icon="plus"
          iconAfter="chevronDown"
          size="small"
          onClick={onClick}
        >
          Create
        </Button>
        <Button href="/book" icon="book">
          Book
        </Button>
        <IconButton icon="settings" label="Settings" />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Book" })).toHaveAttribute("href", "/book");
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("keeps a reset button resetting its form while it has no disabled reason", async () => {
    render(
      <form data-testid="reset-form">
        <input aria-label="Name" defaultValue="" />
        <Button type="reset">Clear</Button>
      </form>,
    );
    const field = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(field, "Ada");
    expect(field).toHaveValue("Ada");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(field).toHaveValue("");
  });

  it("neither submits nor resets its form and fires no handler while disabled with a reason", async () => {
    const onSubmit = jest.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const onClick = jest.fn();
    const onKeyDown = jest.fn();
    const onPointerDown = jest.fn();
    const onMouseDown = jest.fn();
    render(
      <form onSubmit={onSubmit}>
        <input aria-label="Name" defaultValue="" />
        <Button type="submit" disabledReason="No write access">
          Save
        </Button>
        <Button
          type="reset"
          disabledReason="No write access"
          onClick={onClick}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onMouseDown={onMouseDown}
        >
          Clear
        </Button>
        <IconButton
          icon="plus"
          label="Create"
          type="submit"
          disabledReason="No write access"
          onKeyDown={onKeyDown}
        />
      </form>,
    );
    const field = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(field, "Ada");
    const save = screen.getByRole("button", { name: "Save" });
    const reset = screen.getByRole("button", { name: "Clear" });
    const create = screen.getByRole("button", { name: "Create" });
    for (const button of [save, reset, create]) {
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("No write access");
    }
    await userEvent.click(save);
    await userEvent.click(reset);
    reset.focus();
    await userEvent.keyboard("{Enter}");
    create.focus();
    await userEvent.keyboard(" ");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toHaveValue("Ada");
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onPointerDown).not.toHaveBeenCalled();
    expect(onMouseDown).not.toHaveBeenCalled();
  });

  it("toggles a switch and ignores clicks while disabled", async () => {
    const onChange = jest.fn();
    const { rerender } = render(<Switch checked={false} label="Motion" onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Motion" }));
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Switch checked label="Motion" disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("describes a switch with its hint without letting the hint become the name", () => {
    render(<Switch checked={false} label="Auto-scroll" hint="Follows the end of the answer" />);
    const toggle = screen.getByRole("switch", { name: "Auto-scroll" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveAccessibleName("Auto-scroll");
    expect(toggle).toHaveAccessibleDescription("Follows the end of the answer");
    expect(screen.getByText("Follows the end of the answer")).toBeVisible();
  });

  it("keeps a locked switch still and says why, on the control and beside it", async () => {
    const onChange = jest.fn();
    render(
      <Switch checked label="Allow book" disabledReason="Signed in only" onChange={onChange} />,
    );
    const toggle = screen.getByRole("switch", { name: "Allow book" });
    await userEvent.click(toggle);
    toggle.focus();
    await userEvent.keyboard(" ");
    expect(onChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveAttribute("aria-disabled", "true");
    expect(toggle).toHaveAccessibleDescription("Signed in only");
    expect(screen.getByText("Signed in only")).toBeVisible();
  });

  it("asks for the other state from the keyboard, with Space and with Enter", async () => {
    const onChange = jest.fn();
    const { rerender } = render(<Switch checked={false} label="Focus" onChange={onChange} />);
    screen.getByRole("switch", { name: "Focus" }).focus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith(true);
    rerender(<Switch checked label="Focus" onChange={onChange} />);
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("reports the picked segment and tab", async () => {
    const onView = jest.fn();
    const onTab = jest.fn();
    render(
      <>
        <Segment
          label="View"
          value="list"
          onChange={onView}
          options={[
            { value: "list", label: "List", icon: "list" },
            { value: "table", label: "Table" },
          ]}
        />
        <Tabs
          label="Sections"
          value="a"
          onChange={onTab}
          items={[
            { value: "a", label: "Tasks", count: 19 },
            { value: "b", label: "Code" },
          ]}
        />
      </>,
    );
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("radio", { name: "Table" }));
    expect(onView).toHaveBeenCalledWith("table");
    expect(screen.getByRole("tab", { name: /Tasks/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(onTab).toHaveBeenCalledWith("b");
  });

  it("renders a chip as label, toggle or removable", async () => {
    const onClick = jest.fn();
    const onRemove = jest.fn();
    render(
      <>
        <Chip mono icon="filter">
          text only
        </Chip>
        <Chip pressed count={217} onClick={onClick}>
          active
        </Chip>
        <Chip onRemove={onRemove}>atlas</Chip>
      </>,
    );
    expect(screen.getByText("text only").closest("button")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /active/ }));
    expect(onClick).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("labels fields, shows an error instead of the hint, and reports search input", async () => {
    const onChange = jest.fn();
    render(
      <>
        <Field label="Title" hint="Becomes the heading.">
          {(id) => <input id={id} />}
        </Field>
        <Field label="Path" id="path" hint="hidden" error="Already taken.">
          {(id) => <input id={id} />}
        </Field>
        <SearchField label="Search" value="" hero onChange={onChange} trailing={<Kbd>K</Kbd>} />
        <Badge tone="ok" plain>
          backed
        </Badge>
        <Badge>neutral</Badge>
        <Dot tone="warn" />
        <Dot open />
        <Dot />
      </>,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByText("Becomes the heading.")).toBeInTheDocument();
    expect(screen.getByText("Already taken.")).toBeInTheDocument();
    expect(screen.queryByText("hidden")).toBeNull();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search" }), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });
});

describe("display", () => {
  it("never shows an unmeasured meter as zero", () => {
    render(
      <>
        <Meter value={0.94} label="backed" tone="signal" thin />
        <Meter value={null} label="unmeasured" />
        <Meter value={1.7} label="over" />
      </>,
    );
    expect(screen.getByRole("meter", { name: "backed" })).toHaveAttribute("aria-valuenow", "94");
    const unmeasured = screen.getByRole("meter", { name: "unmeasured" });
    expect(unmeasured).not.toHaveAttribute("aria-valuenow");
    expect(unmeasured).toHaveAttribute("aria-valuetext", "not measured");
  });

  it("composes finding, stat, section, surface and rows", async () => {
    const onClick = jest.fn();
    render(
      <>
        <Finding
          eyebrow="Overview"
          figure="94 %"
          of="100"
          tone="ok"
          sentence="Almost everything backed."
          lead="118 open."
          aside="more"
        />
        <Finding sentence="Just one sentence." />
        <Metric value={18} of={220} label="Drift" tone="warn" size="large" />
        <Metric value={1} label="simple" />
        <Section title="Section" meta="12" actions={<button type="button">All</button>} id="s">
          <Surface level="raised" pad={false} className="x">
            <ListRow title="Commit-Gate" sub="authoring/guardrails/commit-gate" onClick={onClick} />
            <ListRow title="Link" href="/r/x" lead="•" trail="19" />
          </Surface>
        </Section>
        <Section title="Without">x</Section>
        <Skeleton radius={4} />
      </>,
    );
    expect(screen.getByRole("heading", { name: "Almost everything backed." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Section" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Commit-Gate/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Link/ })).toHaveAttribute("href", "/r/x");
  });

  it("renders empty and error states with their actions", async () => {
    const onRetry = jest.fn();
    render(
      <>
        <EmptyState
          title="Empty"
          body="Nothing here."
          plain
          action={<button type="button">Create</button>}
        />
        <ErrorState title="Broken" reason="Timeout" onRetry={onRetry} action={<span>extra</span>} />
        <ErrorState title="No retry" />
      </>,
    );
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Empty");
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Timeout");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("lets a distribution segment act as a filter", async () => {
    const onPick = jest.fn();
    render(
      <Distribution
        label="State"
        onPick={onPick}
        parts={[
          { key: "a", label: "backed", value: 182, tone: "var(--t-ok)", active: true },
          { key: "b", label: "open", value: 26 },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "open: 26" }));
    expect(onPick).toHaveBeenCalledWith("b");
    render(<Distribution label="empty" parts={[]} />);
  });

  it("marks deck items by their distance from the focus", () => {
    render(<DepthDeck label="Deck" items={["a", "b", "c", "d"]} focus={0} render={(x) => x} />);
    const items = screen.getAllByRole("listitem");
    expect(items.map((i) => i.getAttribute("data-depth"))).toEqual(["0", "1", "2", "2"]);
  });
});

describe("collection", () => {
  it("windows page numbers with gaps", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(6, 48)).toEqual([1, "gap", 4, 5, 6, 7, 8, "gap", 48]);
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, "gap", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "gap", 18, 19, 20]);
  });

  it("paginates with a range, numbers and page size", async () => {
    const onPage = jest.fn();
    const onPageSize = jest.fn();
    render(
      <Pagination page={3} pageSize={25} total={480} onPage={onPage} onPageSize={onPageSize} />,
    );
    expect(screen.getByText("51–75 of 480")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await userEvent.click(screen.getByRole("button", { name: "Previous page" }));
    await userEvent.click(screen.getByRole("button", { name: "Page 20" }));
    expect(onPage.mock.calls).toEqual([[4], [2], [20]]);
    await userEvent.selectOptions(screen.getByRole("combobox"), "100");
    expect(onPageSize).toHaveBeenCalledWith(100);
  });

  it("loads more on mobile and stops at the end", async () => {
    const onPage = jest.fn();
    const { rerender } = render(
      <Pagination compact page={1} pageSize={25} total={30} onPage={onPage} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Load 5 more" }));
    expect(onPage).toHaveBeenCalledWith(2);
    rerender(<Pagination compact page={2} pageSize={25} total={30} />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<Pagination page={1} pageSize={25} total={0} />);
    expect(screen.getByText("0–0 of 0")).toBeInTheDocument();
  });

  it("sorts by header and announces the direction", async () => {
    const onSort = jest.fn();
    const onRow = jest.fn();
    const rows = [
      { n: 1, t: "One" },
      { n: 2, t: "Two" },
    ];
    const { rerender } = render(
      <DataTable
        label="ADRs"
        rows={rows}
        rowKey={(r) => String(r.n)}
        sort={{ key: "n", dir: "asc" }}
        onSort={onSort}
        onRowClick={onRow}
        dense
        columns={[
          { key: "n", label: "No.", numeric: true, sortable: true, render: (r) => r.n },
          { key: "t", label: "Title", hideOnMobile: true, render: (r) => r.t },
          { key: "x", label: "Sortable", sortable: true, render: () => "" },
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /No\./ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await userEvent.click(screen.getByRole("button", { name: /Sortable/ }));
    expect(onSort).toHaveBeenCalledWith("x");
    await userEvent.click(screen.getByText("Two"));
    expect(onRow).toHaveBeenCalledWith(rows[1]);
    rerender(
      <DataTable
        label="ADRs"
        rows={rows}
        rowKey={(r) => String(r.n)}
        sort={{ key: "n", dir: "desc" }}
        columns={[{ key: "n", label: "No.", sortable: true, render: (r) => r.n }]}
      />,
    );
    expect(screen.getByRole("columnheader")).toHaveAttribute("aria-sort", "descending");
  });

  it("shows a toolbar with facets, sort, group, view and reset", async () => {
    const calls: string[] = [];
    render(
      <CollectionToolbar
        query="adr"
        queryLabel="Search"
        facets={[{ key: "ok", label: "accepted", count: 3, active: true }]}
        sortLabel="Date"
        groupLabel="Year"
        view="list"
        views={[
          { value: "list", label: "List", icon: "list" },
          { value: "table", label: "Table", icon: "table" },
        ]}
        onQuery={(q) => calls.push(`q:${q}`)}
        onFacet={(k) => calls.push(`f:${k}`)}
        onView={(v) => calls.push(`v:${v}`)}
        onSortOpen={() => calls.push("sort")}
        onGroupOpen={() => calls.push("group")}
        onReset={() => calls.push("reset")}
      />,
    );
    const bar = screen.getByRole("toolbar", { name: "Collection" });
    await userEvent.click(within(bar).getByRole("button", { name: /accepted/ }));
    await userEvent.click(within(bar).getByRole("button", { name: "Date" }));
    await userEvent.click(within(bar).getByRole("button", { name: "Year" }));
    await userEvent.click(within(bar).getByRole("radio", { name: "Table" }));
    await userEvent.click(within(bar).getByRole("button", { name: "Reset" }));
    await userEvent.type(within(bar).getByRole("searchbox"), "x");
    expect(calls).toEqual(["f:ok", "sort", "group", "v:table", "reset", "q:adrx"]);
  });

  it("renders one defined form per collection state", async () => {
    const onReset = jest.fn();
    const onRetry = jest.fn();
    const props = {
      toolbar: <div>Toolbar</div>,
      pagination: <div>Pages</div>,
      empty: { title: "No ADRs yet" },
      filteredEmpty: { query: "sidecar", onReset },
      error: { title: "Not readable", reason: "refused", onRetry },
    };
    const { rerender } = render(
      <Collection state="ready" {...props}>
        <div>Content</div>
      </Collection>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();

    rerender(<Collection state="loading" skeletonRows={3} {...props} />);
    expect(screen.queryByText("Pages")).toBeNull();

    rerender(<Collection state="empty" {...props} />);
    expect(screen.getByText("No ADRs yet")).toBeInTheDocument();

    rerender(<Collection state="filtered-empty" {...props} />);
    expect(screen.getByText(/No matches for “sidecar”/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(onReset).toHaveBeenCalled();

    rerender(<Collection state="filtered-empty" />);
    expect(screen.getByText("No matches for these filters")).toBeInTheDocument();

    rerender(<Collection state="error" {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<Collection state="error" error={{ title: "No button" }} />);
    expect(screen.queryByRole("button")).toBeNull();

    render(<SortHint label="Date" dir="asc" />);
    render(<SortHint label="Title" dir="desc" />);
    expect(screen.getByText(/Date ▲/)).toBeInTheDocument();
  });
});

/** A menu button wired the way the apps wire theirs: the app owns open and Esc. */
function MenuButton({ picked }: { picked: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const keys = useMenuTrigger(open, () => setOpen((o) => !o));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <span>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={keys.onClick}
        onKeyDown={keys.onKeyDown}
      >
        Choice
      </button>
      {open ? (
        <Menu
          label="Choices"
          openFocus={keys.focus}
          groups={[
            {
              items: ["One", "Two", "Three"].map((k) => ({
                key: k,
                label: k,
                onSelect: () => {
                  picked(k);
                  setOpen(false);
                },
              })),
            },
          ]}
        />
      ) : null}
    </span>
  );
}

describe("the menu keyboard", () => {
  const trigger = () => screen.getByRole("button", { name: "Choice" });
  const item = (name: string) => screen.getByRole("menuitem", { name });

  it("opens from an arrow on the closed button: down on the first item, up on the last", async () => {
    render(<MenuButton picked={jest.fn()} />);
    expect(screen.queryByRole("menu")).toBeNull();
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menu", { name: "Choices" })).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(item("One")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    await userEvent.keyboard("{ArrowUp}");
    expect(item("Three")).toHaveFocus();
  });

  it("walks the items with the arrows and wraps at both ends; Home and End reach the ends", async () => {
    render(<MenuButton picked={jest.fn()} />);
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowUp}");
    expect(item("Three")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(item("One")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(item("Two")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(item("Three")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(item("One")).toHaveFocus();
  });

  it("opens on Enter with the first item focused and takes the focused item on Enter", async () => {
    const picked = jest.fn();
    render(<MenuButton picked={picked} />);
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    expect(item("One")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(picked).toHaveBeenCalledWith("Two");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("gives the focus back to the button when Esc closes the menu", async () => {
    render(<MenuButton picked={jest.fn()} />);
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(item("Two")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("opens from a pointer without moving the focus into the menu", async () => {
    render(<MenuButton picked={jest.fn()} />);
    await userEvent.click(trigger());
    expect(screen.getByRole("menu", { name: "Choices" })).toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(item("One")).toHaveFocus();
  });
});

describe("overlay", () => {
  it("renders menus with groups, current and active items", async () => {
    const onSelect = jest.fn();
    render(
      <Menu
        label="Actions"
        header={<p>Header</p>}
        footer={<p>Footer</p>}
        groups={[
          {
            label: "Item",
            items: [
              {
                key: "c",
                label: "Copy",
                icon: "copy",
                sub: "Id",
                meta: "C",
                current: true,
                onSelect,
              },
            ],
          },
          { items: [{ key: "a", label: "Ask", active: true }] },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("menuitem", { name: /Copy/ }));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: /Copy/ })).toHaveAttribute("aria-current", "true");
  });

  it("opens sheets and dialogs only when open, and closes through the callback", async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Sheet open={false} title="Sheet title">
        x
      </Sheet>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <Sheet
        open
        side="bottom"
        title="Sheet title"
        meta="m"
        actions={<span>a</span>}
        footer={<span>f</span>}
        onClose={onClose}
      >
        Content
      </Sheet>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <Sheet open modal={false} width={480} title="Dock">
        Content
      </Sheet>,
    );
    expect(screen.getByRole("complementary", { name: "Dock" })).toBeInTheDocument();

    rerender(
      <Dialog open title="Clear?" footer={<span>f</span>} onClose={onClose}>
        Sicher?
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Clear?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(
      <Dialog open={false} title="closed">
        x
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("announces toasts and tooltips", () => {
    render(
      <>
        <Toast tone="ok" duration={null}>
          Copied
        </Toast>
        <Toast tone="bad" duration={null}>
          Failed
        </Toast>
        <Toast duration={null}>Notice</Toast>
        <Tooltip>Tip</Tooltip>
      </>,
    );
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tip");
  });

  it("makes every breadcrumb but the last a place, and opens siblings from the caret", async () => {
    const onDomain = jest.fn();
    const onToggle = jest.fn();
    const { rerender } = render(
      <Breadcrumbs
        onToggleSiblings={onToggle}
        crumbs={[
          { key: "root", label: "Product", href: "/product" },
          {
            key: "dom",
            label: "navigation",
            onClick: onDomain,
            siblings: [{ key: "reg", label: "catalog" }],
          },
          { key: "rec", label: "adr-plugin", mono: true },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Product" })).toHaveAttribute("href", "/product");
    await userEvent.click(screen.getByRole("button", { name: "navigation" }));
    expect(onDomain).toHaveBeenCalled();
    expect(screen.getByText("adr-plugin")).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: "Show siblings" }));
    expect(onToggle).toHaveBeenCalledWith("dom");
    rerender(
      <Breadcrumbs
        openKey="dom"
        crumbs={[
          {
            key: "dom",
            label: "navigation",
            mono: true,
            href: "/d",
            siblings: [{ key: "reg", label: "catalog" }],
          },
          { key: "rec", label: "x" },
        ]}
      />,
    );
    expect(screen.getByRole("menu", { name: "Siblings" })).toHaveTextContent("catalog");
  });

  it("draws a segment that leads nowhere as text, never as a dead button", () => {
    render(
      <Breadcrumbs
        crumbs={[
          { key: "a", label: "Area" },
          { key: "b", label: "Page" },
        ]}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
  });

  it("searches the open sibling list; Enter opens the first hit, Esc and an outside press close", async () => {
    const onReg = jest.fn();
    const onClose = jest.fn();
    const siblings = [
      { key: "catalog", label: "catalog", onSelect: onReg },
      { key: "navigation", label: "navigation" },
      { key: "book", label: "Book area" },
    ];
    render(
      <>
        <p>beside</p>
        <Breadcrumbs
          openKey="dom"
          onClose={onClose}
          crumbs={[
            { key: "dom", label: "navigation", onClick: () => undefined, siblings },
            { key: "rec", label: "x" },
          ]}
        />
      </>,
    );
    const field = screen.getByRole("searchbox", { name: "Find a sibling" });
    expect(field).toHaveFocus();
    await userEvent.type(field, "book");
    // A sibling is found by its key as well as by its label.
    expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual(["Book area"]);
    await userEvent.clear(field);
    await userEvent.type(field, "catalog");
    await userEvent.keyboard("{Enter}");
    expect(onReg).toHaveBeenCalled();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "catalog" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Show siblings" })).toHaveFocus();
    await userEvent.click(screen.getByRole("menu"));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText("beside"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("German locale", () => {
  it("renders the built-in texts of pagination, meter, chip and overlay in German under the German locale", async () => {
    renderInGerman(
      <>
        <Pagination page={3} pageSize={25} total={480} onPage={() => undefined} />
        <Meter value={null} label="m" />
        <Chip onRemove={() => undefined}>atlas</Chip>
        <Dialog open title="t" onClose={() => undefined}>
          x
        </Dialog>
      </>,
    );
    expect(
      screen.getByText(
        germanText.t("primitives.pager.range", { from: "51", to: "75", total: "480" }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: germanText.t("primitives.pager.next") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "m" })).toHaveAttribute(
      "aria-valuetext",
      germanText.t("primitives.meter.unmeasured"),
    );
    expect(
      screen.getByRole("button", { name: germanText.t("primitives.chip.remove") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: germanText.t("primitives.overlay.close") }),
    ).toBeInTheDocument();
  });
});
