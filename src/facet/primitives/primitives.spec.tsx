import { labelText } from "../../i18n/legacy/labels";
import { remainingText } from "../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../i18n/legacy/shared";
import { localized } from "../../i18n/legacy/facet/primitives/primitives.spec.text";
import { screen, within } from "@testing-library/react";
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
  Stat,
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
import { Breadcrumbs, Dialog, Menu, Sheet, Toast, Tooltip } from "./overlay";

import { renderInGerman as render } from "../i18n/testing";

describe("Icon", () => {
  it("is decoration without a label and an image with one", () => {
    const { container } = render(<Icon name="back" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    render(<Icon name="drift" label={germanLabels.text4} className="x" />);
    expect(screen.getByRole("img", { name: germanLabels.text4 })).toBeInTheDocument();
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
          {remainingText.text4}
        </Button>
        <Button href="/docs" icon="book">
          Documentation
        </Button>
        <IconButton icon="settings" label={germanLabels.text5} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: remainingText.text4 }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute("href", "/docs");
    expect(screen.getByRole("button", { name: germanLabels.text5 })).toBeInTheDocument();
  });

  it("keeps a reset button resetting its form while it has no disabled reason", async () => {
    render(
      <form data-testid="reset-form">
        <input aria-label="Name" defaultValue="" />
        <Button type="reset">{remainingText.text5}</Button>
      </form>,
    );
    const field = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(field, "Ada");
    expect(field).toHaveValue("Ada");
    await userEvent.click(screen.getByRole("button", { name: remainingText.text5 }));
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
        <Button type="submit" disabledReason={localized.text1}>
          {remainingText.text6}
        </Button>
        <Button
          type="reset"
          disabledReason={localized.text2}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onMouseDown={onMouseDown}
        >
          {remainingText.text5}
        </Button>
        <IconButton
          icon="plus"
          label={remainingText.text4}
          type="submit"
          disabledReason={localized.text3}
          onKeyDown={onKeyDown}
        />
      </form>,
    );
    const field = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(field, "Ada");
    const save = screen.getByRole("button", { name: remainingText.text6 });
    const reset = screen.getByRole("button", { name: remainingText.text5 });
    const create = screen.getByRole("button", { name: remainingText.text4 });
    for (const button of [save, reset, create]) {
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription(localized.text4);
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
    const { rerender } = render(
      <Switch checked={false} label={labelText.text5} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("switch", { name: labelText.text5 }));
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Switch checked label={labelText.text5} disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reports the picked segment and tab", async () => {
    const onView = jest.fn();
    const onTab = jest.fn();
    render(
      <>
        <Segment
          label={localized.text5}
          value="list"
          onChange={onView}
          options={[
            { value: "list", label: labelText.text6, icon: "list" },
            { value: "table", label: labelText.text7 },
          ]}
        />
        <Tabs
          label={labelText.text8}
          value="a"
          onChange={onTab}
          items={[
            { value: "a", label: localized.text6, count: 19 },
            { value: "b", label: "Code" },
          ]}
        />
      </>,
    );
    expect(screen.getByRole("radio", { name: labelText.text6 })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("radio", { name: labelText.text7 }));
    expect(onView).toHaveBeenCalledWith("table");
    expect(screen.getByRole("tab", { name: localized.text7 })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(onTab).toHaveBeenCalledWith("b");
  });

  it("renders a chip as label, toggle or removable", async () => {
    const onClick = jest.fn();
    const onRemove = jest.fn();
    render(
      <>
        <Chip mono icon="filter">
          {localized.text8}
        </Chip>
        <Chip pressed count={217} onClick={onClick}>
          {remainingText.text7}
        </Chip>
        <Chip onRemove={onRemove}>atlas</Chip>
      </>,
    );
    expect(screen.getByText(localized.text9).closest("button")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: remainingText.text8 }));
    expect(onClick).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: germanLabels.text6 }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("labels fields, shows an error instead of the hint, and reports search input", async () => {
    const onChange = jest.fn();
    render(
      <>
        <Field label={labelText.text9} hint={localized.text10}>
          {(id) => <input id={id} />}
        </Field>
        <Field label={labelText.text10} id={"path"} hint={labelText.text12} error="Schon vergeben.">
          {(id) => <input id={id} />}
        </Field>
        <SearchField
          label={remainingText.text9}
          value=""
          hero
          onChange={onChange}
          trailing={<Kbd>K</Kbd>}
        />
        <Badge tone="ok" plain>
          {labelText.text13}
        </Badge>
        <Badge>neutral</Badge>
        <Dot tone="warn" />
        <Dot open />
        <Dot />
      </>,
    );
    expect(screen.getByLabelText(labelText.text9)).toBeInTheDocument();
    expect(screen.getByText(localized.text11)).toBeInTheDocument();
    expect(screen.getByText("Schon vergeben.")).toBeInTheDocument();
    expect(screen.queryByText(labelText.text12)).toBeNull();
    await userEvent.type(screen.getByRole("searchbox", { name: remainingText.text9 }), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });
});

describe("display", () => {
  it("never shows an unmeasured meter as zero", () => {
    render(
      <>
        <Meter value={0.94} label={labelText.text13} tone="signal" thin />
        <Meter value={null} label={labelText.text14} />
        <Meter value={1.7} label={localized.text12} />
      </>,
    );
    expect(screen.getByRole("meter", { name: labelText.text13 })).toHaveAttribute(
      "aria-valuenow",
      "94",
    );
    const unmeasured = screen.getByRole("meter", { name: labelText.text14 });
    expect(unmeasured).not.toHaveAttribute("aria-valuenow");
    expect(unmeasured).toHaveAttribute("aria-valuetext", localized.text13);
  });

  it("composes finding, stat, section, surface and rows", async () => {
    const onClick = jest.fn();
    render(
      <>
        <Finding
          eyebrow={germanLabels.text7}
          figure="94 %"
          of="100"
          tone="ok"
          sentence={labelText.text15}
          lead={localized.text14}
          aside={labelText.text16}
        />
        <Finding sentence={localized.text15} />
        <Stat value="18" of="220" label={germanLabels.text4} tone="warn" large />
        <Stat value="1" label={labelText.extra1} />
        <Section
          title={labelText.text17}
          meta="12"
          actions={<button type="button">{germanLabels.text8}</button>}
          id="s"
        >
          <Surface level="raised" pad={false} className="x">
            <ListRow title="Commit-Gate" sub="lists/permissions/admin" onClick={onClick} />
            <ListRow title="Link" href="/r/x" lead="•" trail="19" />
          </Surface>
        </Section>
        <Section title={localized.text16}>x</Section>
        <Skeleton radius={4} />
      </>,
    );
    expect(screen.getByRole("heading", { name: labelText.text15 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: labelText.text17 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Commit-Gate/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Link/ })).toHaveAttribute("href", "/r/x");
  });

  it("renders empty and error states with their actions", async () => {
    const onRetry = jest.fn();
    render(
      <>
        <EmptyState
          title={labelText.text18}
          body="Nichts da."
          plain
          action={<button type="button">{remainingText.text4}</button>}
        />
        <ErrorState
          title={labelText.text19}
          reason="Timeout"
          onRetry={onRetry}
          action={<span>extra</span>}
        />
        <ErrorState title={localized.text17} />
      </>,
    );
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(labelText.text18);
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Timeout");
    await userEvent.click(screen.getByRole("button", { name: labelText.text20 }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("lets a distribution segment act as a filter", async () => {
    const onPick = jest.fn();
    render(
      <Distribution
        label={localized.text18}
        onPick={onPick}
        parts={[
          { key: "a", label: labelText.text13, value: 182, tone: "var(--t-ok)", active: true },
          { key: "b", label: localized.text19, value: 26 },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: localized.text20 }));
    expect(onPick).toHaveBeenCalledWith("b");
    render(<Distribution label={labelText.text21} parts={[]} />);
  });

  it("marks deck items by their distance from the focus", () => {
    render(
      <DepthDeck
        label={labelText.text22}
        items={["a", "b", "c", "d"]}
        focus={0}
        render={(x) => x}
      />,
    );
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
    expect(screen.getByText(germanLabels.text9)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labelText.text23 })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(screen.getByRole("button", { name: localized.text21 }));
    await userEvent.click(screen.getByRole("button", { name: labelText.text24 }));
    await userEvent.click(screen.getByRole("button", { name: labelText.text25 }));
    expect(onPage.mock.calls).toEqual([[4], [2], [20]]);
    await userEvent.selectOptions(screen.getByRole("combobox"), "100");
    expect(onPageSize).toHaveBeenCalledWith(100);
  });

  it("loads more on mobile and stops at the end", async () => {
    const onPage = jest.fn();
    const { rerender } = render(
      <Pagination compact page={1} pageSize={25} total={30} onPage={onPage} />,
    );
    await userEvent.click(screen.getByRole("button", { name: localized.text22 }));
    expect(onPage).toHaveBeenCalledWith(2);
    rerender(<Pagination compact page={2} pageSize={25} total={30} />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<Pagination page={1} pageSize={25} total={0} />);
    expect(screen.getByText(germanLabels.text10)).toBeInTheDocument();
  });

  it("sorts by header and announces the direction", async () => {
    const onSort = jest.fn();
    const onRow = jest.fn();
    const rows = [
      { n: 1, t: labelText.text26 },
      { n: 2, t: labelText.text27 },
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
          { key: "n", label: "Nr.", numeric: true, sortable: true, render: (r) => r.n },
          { key: "t", label: labelText.text9, hideOnMobile: true, render: (r) => r.t },
          { key: "x", label: labelText.text28, sortable: true, render: () => "" },
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /Nr\./ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await userEvent.click(screen.getByRole("button", { name: labelText.text29 }));
    expect(onSort).toHaveBeenCalledWith("x");
    await userEvent.click(screen.getByText(labelText.text27));
    expect(onRow).toHaveBeenCalledWith(rows[1]);
    rerender(
      <DataTable
        label="ADRs"
        rows={rows}
        rowKey={(r) => String(r.n)}
        sort={{ key: "n", dir: "desc" }}
        columns={[{ key: "n", label: "Nr.", sortable: true, render: (r) => r.n }]}
      />,
    );
    expect(screen.getByRole("columnheader")).toHaveAttribute("aria-sort", "descending");
  });

  it("shows a toolbar with facets, sort, group, view and reset", async () => {
    const calls: string[] = [];
    render(
      <CollectionToolbar
        query="adr"
        queryLabel={remainingText.text9}
        facets={[{ key: "ok", label: labelText.text30, count: 3, active: true }]}
        sortLabel={labelText.text31}
        groupLabel={labelText.text32}
        view="list"
        views={[
          { value: "list", label: labelText.text6, icon: "list" },
          { value: "table", label: labelText.text7, icon: "table" },
        ]}
        onQuery={(q) => calls.push(`q:${q}`)}
        onFacet={(k) => calls.push(`f:${k}`)}
        onView={(v) => calls.push(`v:${v}`)}
        onSortOpen={() => calls.push("sort")}
        onGroupOpen={() => calls.push("group")}
        onReset={() => calls.push("reset")}
      />,
    );
    const bar = screen.getByRole("toolbar", { name: labelText.text33 });
    await userEvent.click(within(bar).getByRole("button", { name: labelText.text34 }));
    await userEvent.click(within(bar).getByRole("button", { name: labelText.text31 }));
    await userEvent.click(within(bar).getByRole("button", { name: labelText.text32 }));
    await userEvent.click(within(bar).getByRole("radio", { name: labelText.text7 }));
    await userEvent.click(within(bar).getByRole("button", { name: localized.text23 }));
    await userEvent.type(within(bar).getByRole("searchbox"), "x");
    expect(calls).toEqual(["f:ok", "sort", "group", "v:table", "reset", "q:adrx"]);
  });

  it("renders one defined form per collection state", async () => {
    const onReset = jest.fn();
    const onRetry = jest.fn();
    const props = {
      toolbar: <div>{germanLabels.text11}</div>,
      pagination: <div>{labelText.text35}</div>,
      empty: { title: localized.text24 },
      filteredEmpty: { query: "sidecar", onReset },
      error: { title: localized.text25, reason: localized.text26, onRetry },
    };
    const { rerender } = render(
      <Collection state="ready" {...props}>
        <div>{localized.text27}</div>
      </Collection>,
    );
    expect(screen.getByText(localized.text28)).toBeInTheDocument();
    expect(screen.getByText(labelText.text35)).toBeInTheDocument();

    rerender(<Collection state="loading" skeletonRows={3} {...props} />);
    expect(screen.queryByText(labelText.text35)).toBeNull();

    rerender(<Collection state="empty" {...props} />);
    expect(screen.getByText(localized.text29)).toBeInTheDocument();

    rerender(<Collection state="filtered-empty" {...props} />);
    expect(screen.getByText(localized.text30)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: localized.text31 }));
    expect(onReset).toHaveBeenCalled();

    rerender(<Collection state="filtered-empty" />);
    expect(screen.getByText(localized.text32)).toBeInTheDocument();

    rerender(<Collection state="error" {...props} />);
    await userEvent.click(screen.getByRole("button", { name: labelText.text20 }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<Collection state="error" error={{ title: localized.text33 }} />);
    expect(screen.queryByRole("button")).toBeNull();

    render(<SortHint label={labelText.text31} dir="asc" />);
    render(<SortHint label={labelText.text9} dir="desc" />);
    expect(screen.getByText(labelText.text36)).toBeInTheDocument();
  });
});

describe("overlay", () => {
  it("renders menus with groups, current and active items", async () => {
    const onSelect = jest.fn();
    render(
      <Menu
        label={labelText.text37}
        header={<p>{labelText.text38}</p>}
        footer={<p>{localized.text34}</p>}
        groups={[
          {
            label: "Record",
            items: [
              {
                key: "c",
                label: germanLabels.text12,
                icon: "copy",
                sub: "Id",
                meta: "C",
                current: true,
                onSelect,
              },
            ],
          },
          { items: [{ key: "a", label: localized.text35, active: true }] },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("menuitem", { name: germanLabels.text13 }));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: germanLabels.text13 })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("opens sheets and dialogs only when open, and closes through the callback", async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Sheet open={false} title={labelText.text39}>
        x
      </Sheet>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <Sheet
        open
        side="bottom"
        title={labelText.text39}
        meta="m"
        actions={<span>a</span>}
        footer={<span>f</span>}
        onClose={onClose}
      >
        {localized.text36}
      </Sheet>,
    );
    await userEvent.click(screen.getByRole("button", { name: localized.text37 }));
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <Sheet open modal={false} width={480} title="Dock">
        {localized.text38}
      </Sheet>,
    );
    expect(screen.getByRole("complementary", { name: "Dock" })).toBeInTheDocument();

    rerender(
      <Dialog open title={remainingText.text10} footer={<span>f</span>} onClose={onClose}>
        Sicher?
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: remainingText.text10 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: localized.text39 }));
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(
      <Dialog open={false} title={germanLabels.text14}>
        x
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("announces toasts and tooltips", () => {
    render(
      <>
        <Toast tone="ok">{remainingText.text11}</Toast>
        <Toast tone="bad">{labelText.text40}</Toast>
        <Toast>{labelText.text41}</Toast>
        <Tooltip>{labelText.text42}</Tooltip>
      </>,
    );
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(screen.getByRole("tooltip")).toHaveTextContent(labelText.text42);
  });

  it("makes every breadcrumb but the last a place, and opens siblings from the caret", async () => {
    const onDomain = jest.fn();
    const onToggle = jest.fn();
    const { rerender } = render(
      <Breadcrumbs
        onToggleSiblings={onToggle}
        crumbs={[
          { key: "root", label: labelText.text43, href: "/product" },
          {
            key: "dom",
            label: "navigation",
            onClick: onDomain,
            siblings: [{ key: "reg", label: "registry" }],
          },
          { key: "rec", label: "adr-plugin", mono: true },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: labelText.text43 })).toHaveAttribute(
      "href",
      "/product",
    );
    await userEvent.click(screen.getByRole("button", { name: "navigation" }));
    expect(onDomain).toHaveBeenCalled();
    expect(screen.getByText("adr-plugin")).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: remainingText.text12 }));
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
            siblings: [{ key: "reg", label: "registry" }],
          },
          { key: "rec", label: "x" },
        ]}
      />,
    );
    expect(screen.getByRole("menu", { name: labelText.text45 })).toHaveTextContent("registry");
  });

  it("draws a segment that leads nowhere as text, never as a dead button", () => {
    render(
      <Breadcrumbs
        crumbs={[
          { key: "a", label: localized.text40 },
          { key: "b", label: labelText.text46 },
        ]}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(localized.text41)).toBeInTheDocument();
  });

  it("searches the open sibling list; Enter opens the first hit, Esc and an outside press close", async () => {
    const onReg = jest.fn();
    const onClose = jest.fn();
    const siblings = [
      { key: "registry", label: "registry", onSelect: onReg },
      { key: "navigation", label: "navigation" },
      { key: "documentation", label: "Documentation area" },
    ];
    render(
      <>
        <p>{labelText.text47}</p>
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
    const field = screen.getByRole("searchbox", { name: labelText.text48 });
    expect(field).toHaveFocus();
    await userEvent.type(field, "documentation");

    expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual([
      "Documentation area",
    ]);
    await userEvent.clear(field);
    await userEvent.type(field, "reg");
    await userEvent.keyboard("{Enter}");
    expect(onReg).toHaveBeenCalled();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "registry" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: remainingText.text12 })).toHaveFocus();
    await userEvent.click(screen.getByRole("menu"));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText(labelText.text47));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
