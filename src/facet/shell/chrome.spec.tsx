import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppBar } from "./Shell";
import { HistoryMenu, HistoryNav, MobileTabBar, MoreSheet, NavBar } from "./chrome";
import { renderInGerman } from "../i18n/testing";
import { de } from "../i18n";

describe("AppBar chrome", () => {
  it("makes the brand a home button and writes an unmeasured figure as not measured", async () => {
    const home = jest.fn();
    const open = jest.fn();
    const { container } = render(
      <AppBar
        brand={<span>Atlas</span>}
        onHome={home}
        homeLabel="To the overview"
        stats={[
          { key: "f", label: "Features", value: 1200 },
          { key: "d", label: "Drift", value: 3, tone: "warn" },
          { key: "p", label: "Proven", value: null },
        ]}
        command={{ label: "Go to a record", onOpen: open, keys: ["Ctrl", "K"] }}
        actions={<button type="button">Share</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "To the overview" }));
    expect(home).toHaveBeenCalled();
    const figures = container.querySelector("dl")!;
    expect(
      within(figures)
        .getAllByRole("term")
        .map((t) => t.textContent),
    ).toEqual(["Features", "Drift", "Proven"]);
    const values = within(figures).getAllByRole("definition");
    expect(values.map((v) => v.textContent)).toEqual(["1,200", "3", "—not measured"]);
    expect(values[1]).toHaveClass("t-warn");
    expect(values[2]).not.toHaveClass("t-warn");
    const command = screen.getByRole("button", { name: /Go to a record/ });
    expect(command).toHaveTextContent("Go to a recordCtrlK");
    await userEvent.click(command);
    expect(open).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("reduces to lead, brand, search and menu in the compact form", async () => {
    const menu = jest.fn();
    const open = jest.fn();
    const { container } = render(
      <AppBar
        compact
        brand="Atlas"
        title="Payments"
        meta="3 drifted"
        stats={[{ key: "f", label: "Features", value: 1 }]}
        command={{ label: "Go to", onOpen: open }}
        actions={<button type="button">Share</button>}
        onMenu={menu}
      >
        <span>centre</span>
      </AppBar>,
    );
    expect(container.querySelector(".t-appbar")).toHaveAttribute("data-compact", "true");
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(screen.queryByText("centre")).toBeNull();
    expect(screen.queryByText("3 drifted")).toBeNull();
    expect(container.querySelector("dl")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Go to" }));
    expect(open).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(menu).toHaveBeenCalled();
  });
});

describe("HistoryNav", () => {
  function Harness({ entries = 3 }: { entries?: number }) {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const picked = jest.fn();
    return (
      <HistoryNav
        canBack
        canForward={false}
        history={{
          open,
          onToggle: () => setOpen((o) => !o),
          menu: (
            <HistoryMenu
              scope="this browser"
              filter={filter}
              onFilter={setFilter}
              onPick={picked}
              onClear={() => setOpen(false)}
              entries={Array.from({ length: entries }, (_, i) => ({
                key: `p${i}`,
                label: i === 0 ? "Overview" : `Record ${i}`,
                sub: "Record",
                time: `10:0${i % 10}`,
                current: i === 0,
                icon: "document" as const,
              }))}
            />
          ),
        }}
      />
    );
  }

  it("names a disabled direction with its reason and opens the history from the keyboard", async () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Forward — no later place" })).toBeDisabled();
    const trigger = screen.getByRole("button", { name: "History" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    const menu = screen.getByRole("menu", { name: "History" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveFocus();
    expect(items[0]).toHaveAttribute("aria-current", "true");
    expect(within(menu).getByText("History · 3")).toBeInTheDocument();
    expect(within(menu).getByText("this browser")).toBeInTheDocument();
    expect(within(menu).queryByRole("searchbox")).toBeNull();
    await userEvent.click(within(menu).getByRole("button", { name: "Clear history" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens from a right click on Back and filters a long history", async () => {
    render(<Harness entries={25} />);
    await userEvent.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: "Back" }),
    });
    const menu = screen.getByRole("menu", { name: "History" });
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(14);
    expect(within(menu).getByText("11 older")).toBeInTheDocument();
    await userEvent.type(within(menu).getByRole("searchbox", { name: "Filter places" }), "2");
    const labels = within(menu)
      .getAllByRole("menuitem")
      .map((i) => i.textContent);
    expect(labels.every((l) => l?.includes("2"))).toBe(true);
  });

  it("keeps only Back in the compact form", () => {
    render(<HistoryNav compact canBack={false} canForward />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Back — no earlier place" })).toBeDisabled();
  });
});

describe("NavBar and MobileTabBar", () => {
  it("marks the current area, counts badges and puts secondary areas after a divider", async () => {
    const pick = jest.fn();
    const { container } = render(
      <NavBar
        onPick={pick}
        items={[
          { key: "home", label: "Overview", icon: "home", current: true },
          { key: "find", label: "Findings", icon: "warning", badge: 1234 },
          { key: "wiki", label: "Wiki", secondary: true, mark: <i />, note: "extension" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Navigation" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Overview",
      "Findings1,234",
      "Wiki · extension",
    ]);
    expect(buttons[0]).toHaveAttribute("aria-current", "page");
    expect(buttons[1]).not.toHaveAttribute("aria-current");
    const children = [...nav.children];
    expect(children.indexOf(container.querySelector(".t-nav__divider")!)).toBe(2);
    await userEvent.click(buttons[2]);
    expect(pick).toHaveBeenCalledWith("wiki");
  });

  it("names a tab's new-content dot for screen readers", async () => {
    const pick = jest.fn();
    renderInGerman(
      <MobileTabBar
        label="Areas"
        onPick={pick}
        items={[
          { key: "a", label: "Overview", icon: "home", current: true },
          { key: "b", label: "Findings", icon: "warning", badge: true },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Areas" });
    expect(within(nav).getByRole("img", { name: de["primitives.nav.new"] })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /Overview/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(within(nav).getByRole("button", { name: /Findings/ }));
    expect(pick).toHaveBeenCalledWith("b");
  });
});

describe("MoreSheet", () => {
  function Harness() {
    const [role, setRole] = useState("dev");
    return (
      <MoreSheet
        open
        meta={`Role: ${role}`}
        items={[
          { key: "code", label: "Code", icon: "code", current: true },
          { key: "wiki", label: "Wiki", mark: <i />, note: "extension" },
        ]}
        choice={{
          label: "Who is reading?",
          current: role,
          onPick: setRole,
          options: [
            { key: "lead", label: "Leadership" },
            { key: "dev", label: "Developer" },
            { key: "qa", label: "Review" },
          ],
        }}
        actions={<button type="button">Share</button>}
        footer={<button type="button">Settings</button>}
      />
    );
  }

  it("holds the remaining areas, one exclusive choice, actions and a footer", async () => {
    render(<Harness />);
    const sheet = screen.getByRole("dialog", { name: "More" });
    expect(within(sheet).getByRole("button", { name: "Code" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(sheet).getByRole("button", { name: "Wiki · extension" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Settings" })).toBeInTheDocument();
    const group = within(sheet).getByRole("radiogroup", { name: "Who is reading?" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
    radios[1].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(within(group).getByRole("radio", { name: "Review" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(within(group).getByRole("radio", { name: "Review" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(within(group).getByRole("radio", { name: "Leadership" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(within(group).getByRole("radio", { name: "Review" })).toHaveFocus();
    await userEvent.keyboard("a");
    await userEvent.click(within(group).getByRole("radio", { name: "Developer" }));
    expect(screen.getByText("Role: dev")).toBeInTheDocument();
  });

  it("lets the first option take the focus when nothing is chosen", () => {
    render(
      <MoreSheet
        open
        items={[]}
        choice={{
          label: "Workspace",
          options: [
            { key: "a", label: "A" },
            { key: "b", label: "B" },
          ],
        }}
      />,
    );
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([0, -1]);
  });
});
