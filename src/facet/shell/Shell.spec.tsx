import { useEffect, useState } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppShell,
  BootScreen,
  DriftMark,
  driftOffset,
  HistoryMenu,
  LoadMark,
  Logo,
  MobileTabBar,
  MoreSheet,
  NavBar,
  RoleMenu,
  TopBar,
} from "./Shell";
import { HISTORY, NAV, rolesFor } from "../fixtures/shell";
import { IconButton } from "../primitives/controls";
import { registry } from "../fixtures";
import { renderInGerman } from "../i18n/testing";
import { createText } from "../i18n/TextProvider";
import { de } from "../i18n/de";

const ROLES = rolesFor(createText("en").t);

describe("TopBar", () => {
  it("disables back when there is no earlier place and opens the place list", async () => {
    const onHistory = jest.fn();
    render(
      <TopBar
        canBack={false}
        canForward={false}
        historyOpen
        history={{ entries: HISTORY }}
        roleName="Development"
        theme={{ label: "Light", icon: "sun" }}
        onHistory={onHistory}
      />,
    );
    expect(screen.getByRole("button", { name: /Back — no earlier place yet/ })).toBeDisabled();
    expect(screen.getByRole("menu", { name: "Visited places" })).toHaveTextContent("adr-plugin");
    await userEvent.click(screen.getByRole("button", { name: "Visited places" }));
    expect(onHistory).toHaveBeenCalled();
  });
});

describe("BootScreen", () => {
  it("shows an unmeasured count as a dash, never as zero", () => {
    render(
      <BootScreen
        phase="records"
        progress={null}
        counts={{ records: registry.features.length, files: null, anchors: null }}
      />,
    );
    expect(screen.getByText("Reading records")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "share not known yet",
    );
    expect(screen.getByText("220")).toBeInTheDocument();
  });
});

describe("TopBar actions", () => {
  it("reaches back, forward, home, command, role, theme and settings", async () => {
    const calls: string[] = [];
    const log = (k: string) => () => calls.push(k);
    render(
      <TopBar
        canBack
        canForward
        stats={{ features: 217, provenPct: null, drift: 0 }}
        roleName="Product"
        roleOpen
        roleMenu={
          <RoleMenu roles={ROLES} current="leadership" onPick={(k) => calls.push(`role:${k}`)} />
        }
        theme={{ label: "Light", icon: "sun" }}
        onBack={log("back")}
        onForward={log("forward")}
        onHome={log("home")}
        onCommand={log("command")}
        onRole={log("role")}
        onTheme={log("theme")}
        onSettings={log("settings")}
        onHistory={log("history")}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Forward" }));
    await userEvent.click(screen.getByRole("button", { name: "FACET Atlas, to the overview" }));
    await userEvent.click(screen.getByRole("button", { name: /Go to a record, role or command/ }));
    await userEvent.click(screen.getByRole("button", { name: "Product" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: /Agent/ }));
    await userEvent.click(screen.getByRole("button", { name: "Light" }));
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.contextMenu(screen.getByRole("button", { name: "Back" }));
    expect(calls).toEqual([
      "back",
      "forward",
      "home",
      "command",
      "role",
      "role:agent",
      "theme",
      "settings",
      "history",
    ]);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /Leadership/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("opens the role menu and the place list from the keyboard and gives the focus back on close", async () => {
    function Bar() {
      const [open, setOpen] = useState<"role" | "history" | null>(null);
      const toggle = (m: "role" | "history") => () => setOpen((o) => (o === m ? null : m));
      useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
          if (e.key === "Escape") setOpen(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, []);
      return (
        <div>
          <TopBar
            canBack
            canForward={false}
            roleName="Product"
            roleOpen={open === "role"}
            roleMenu={<RoleMenu roles={ROLES} current="leadership" />}
            historyOpen={open === "history"}
            history={{ entries: HISTORY }}
            theme={{ label: "Light", icon: "sun" }}
            onRole={toggle("role")}
            onHistory={toggle("history")}
          />
        </div>
      );
    }
    render(<Bar />);
    const role = screen.getByRole("button", { name: "Product" });
    role.focus();
    await userEvent.keyboard("{ArrowDown}");
    const radios = screen.getAllByRole("menuitemradio");
    expect(radios[0]).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(radios[radios.length - 1]).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(role).toHaveFocus();

    const places = screen.getByRole("button", { name: "Visited places" });
    places.focus();
    await userEvent.keyboard("{ArrowUp}");
    const items = screen.getAllByRole("menuitem");
    expect(items[items.length - 1]).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(places).toHaveFocus();
  });

  it("shrinks to back, logo, search and menu on mobile", async () => {
    const onMenu = jest.fn();
    const onCommand = jest.fn();
    render(
      <TopBar
        compact
        canBack={false}
        canForward
        roleName="x"
        theme={{ label: "Dark", icon: "moon" }}
        onMenu={onMenu}
        onCommand={onCommand}
        stats={{ features: 1, provenPct: 1, drift: 1 }}
      />,
    );
    expect(screen.queryByRole("button", { name: /^Vor/ })).toBeNull();
    expect(screen.queryByText("Features")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.click(screen.getByRole("button", { name: "Go to" }));
    expect(onMenu).toHaveBeenCalled();
    expect(onCommand).toHaveBeenCalled();
  });
});

describe("HistoryMenu", () => {
  const many = Array.from({ length: 40 }, (_, i) => ({
    key: `k${i}`,
    time: "12:00",
    label: `Place ${i}`,
    kind: "record" as const,
  }));

  it("filters places, counts older ones and clears", async () => {
    const onFilter = jest.fn();
    const onPick = jest.fn();
    const onClear = jest.fn();
    const { rerender } = render(
      <HistoryMenu entries={many} onFilter={onFilter} onPick={onPick} onClear={onClear} />,
    );
    expect(screen.getByText("26 older")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter places" }), "3");
    expect(onFilter).toHaveBeenCalledWith("3");
    await userEvent.click(screen.getByRole("menuitem", { name: /Place 0/ }));
    expect(onPick).toHaveBeenCalledWith("k0");
    await userEvent.click(screen.getByRole("button", { name: "Clear history" }));
    expect(onClear).toHaveBeenCalled();
    rerender(<HistoryMenu entries={many} filter="Place 3" />);
    expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Place 3"),
        expect.stringContaining("Place 39"),
      ]),
    );
    expect(screen.getAllByRole("menuitem")).toHaveLength(11);
  });

  it("shows no filter field for a short list", () => {
    render(<HistoryMenu entries={HISTORY.slice(0, 3)} />);
    expect(screen.queryByRole("searchbox")).toBeNull();
  });
});

describe("navigation", () => {
  it("separates plugin areas and marks the current one", async () => {
    const onPick = jest.fn();
    render(<NavBar items={NAV} onPick={onPick} />);
    expect(screen.getByRole("button", { name: /Overview/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: /Decisions · Plugin/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Records/ })).toHaveTextContent("11");
    await userEvent.click(screen.getByRole("button", { name: /Product/ }));
    expect(onPick).toHaveBeenCalledWith("product");
    render(<NavBar items={NAV.filter((n) => !n.plugin)} />);
  });

  it("offers a tab bar and a more sheet on mobile", async () => {
    const onPick = jest.fn();
    const onClose = jest.fn();
    render(
      <>
        <MobileTabBar
          onPick={onPick}
          items={[
            { key: "overview", label: "Overview", icon: "home", current: true },
            { key: "records", label: "Records", icon: "records", badge: true },
          ]}
        />
        <MoreSheet open items={NAV} roleName="Agent" onPick={onPick} onClose={onClose} />
      </>,
    );
    await userEvent.click(screen.getAllByRole("button", { name: /Records/ })[0]);
    expect(onPick).toHaveBeenCalledWith("records");
    expect(screen.getByRole("dialog", { name: "More" })).toHaveTextContent("Role: Agent");
    await userEvent.click(screen.getByRole("button", { name: "Decisions" }));
    expect(onPick).toHaveBeenCalledWith("adr");
  });
});

describe("AppShell", () => {
  it("puts the nav bar on desktop and the tab bar on mobile", () => {
    const { rerender } = render(
      <AppShell
        top={<div>Head</div>}
        nav={<nav aria-label="Areas">n</nav>}
        tabbar={<nav aria-label="Tabs">t</nav>}
      >
        Page
      </AppShell>,
    );
    expect(screen.getByRole("navigation", { name: "Areas" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Tabs" })).toBeNull();
    rerender(
      <AppShell
        mobile
        theme={{ theme: "paper", mode: "light" }}
        top={<div>Head</div>}
        nav={<nav aria-label="Areas">n</nav>}
        tabbar={<nav aria-label="Tabs">t</nav>}
      >
        Page
      </AppShell>,
    );
    expect(screen.queryByRole("navigation", { name: "Areas" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument();
    expect(screen.getByRole("main").parentElement).toHaveAttribute("data-t-theme", "paper");
  });

  it("makes everything but the overlay inert while a modal overlay is open", () => {
    const shell = (modal: boolean) => (
      <AppShell
        mobile
        modal={modal}
        top={<button type="button">Head</button>}
        tabbar={<nav aria-label="Tabs">t</nav>}
        chat={<button type="button">Chat</button>}
        overlay={<div role="dialog" aria-label="Search" />}
      >
        Page
      </AppShell>
    );
    const { rerender } = render(shell(true));
    const covered = [
      screen.getByTestId("shell-head"),
      screen.getByRole("main", { hidden: true }),
      screen.getByTestId("shell-chrome"),
    ];
    for (const part of covered) expect(part).toHaveAttribute("inert");
    expect(screen.getByRole("dialog", { name: "Search" }).closest("[inert]")).toBeNull();
    rerender(shell(false));
    for (const part of covered) expect(part).not.toHaveAttribute("inert");
  });

  it("mounts the document's tooltip, so an IconButton in the bar explains itself to the keyboard", async () => {
    render(
      <AppShell top={<IconButton icon="settings" label="Settings" />} overlay={null}>
        Page
      </AppShell>,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Settings");
  });
});

describe("BootScreen states", () => {
  it("offers a retry after a failed connection", async () => {
    const onRetry = jest.fn();
    render(
      <BootScreen
        phase="connect"
        progress={null}
        counts={{ records: null, files: null, anchors: null }}
        error={{ title: "No answer", reason: "Timeout", onRetry }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    expect(onRetry).toHaveBeenCalled();
    render(
      <BootScreen
        phase="connect"
        progress={null}
        counts={{ records: null, files: null, anchors: null }}
        error={{ title: "Without", reason: "x" }}
      />,
    );
  });

  it("marks finished, current and coming phases and shows a measured share", () => {
    render(
      <BootScreen
        phase="index"
        file="a.go"
        leaving
        progress={78}
        counts={{ records: 220, files: 1852, anchors: 525 }}
      />,
    );
    const steps = screen.getByRole("list", { name: "Phases" }).querySelectorAll("li");
    expect(Array.from(steps).map((s) => s.getAttribute("data-state"))).toEqual([
      "done",
      "done",
      "done",
      "done",
      "now",
      "next",
      "next",
    ]);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "78%");
    expect(screen.getByTestId("boot")).toHaveAttribute("data-leaving", "true");
  });

  it("draws the logo and the wave mark", () => {
    render(
      <>
        <Logo size={32} />
        <LoadMark size={80} />
      </>,
    );
    expect(
      screen.getByRole("img", { name: "Atlas is reading" }).querySelectorAll("rect"),
    ).toHaveLength(5);
  });
});

describe("the drift mark", () => {
  const bar = (stats: Parameters<typeof TopBar>[0]["stats"], compact = false) => (
    <TopBar
      compact={compact}
      canBack={false}
      canForward={false}
      roleName="x"
      theme={{ label: "Light", icon: "sun" }}
      stats={stats}
    />
  );
  const blocks = (mark: Element) =>
    [...mark.querySelectorAll("rect")].map((r) => (r as SVGRectElement).style.transform);

  it("offsets the logo's blocks by the measured share of records with drift", () => {
    const { rerender } = render(bar({ features: 10, provenPct: 50, drift: 4, driftShare: 0.5 }));
    const brand = screen.getByRole("button", { name: "FACET Atlas, to the overview" });
    let mark = brand.querySelector("svg")!;
    expect(mark).toHaveAttribute("data-state", "drift");
    // Half the records drift: half the brand offset of 22, 11 → the even 12.
    expect(blocks(mark)).toEqual(["translateY(5px)", "translateY(17px)"]);
    expect(brand).toHaveAttribute("title", expect.stringMatching(/^Drift: 50\s?% of records$/));

    rerender(bar({ features: 10, provenPct: 50, drift: 0, driftShare: 0 }, true));
    mark = screen
      .getByRole("button", { name: "FACET Atlas, to the overview" })
      .querySelector("svg")!;
    expect(mark).toHaveAttribute("data-state", "level");
    expect(blocks(mark)).toEqual(["translateY(11px)", "translateY(11px)"]);
  });

  it("never draws an unmeasured drift as level blocks", () => {
    render(bar({ features: 10, provenPct: 50, drift: null, driftShare: 0 }));
    const brand = screen.getByRole("button", { name: "FACET Atlas, to the overview" });
    const mark = brand.querySelector("svg")!;
    expect(mark).toHaveAttribute("data-state", "unmeasured");
    expect(blocks(mark)).toEqual(["translateY(0px)", "translateY(22px)"]);
    expect(mark.querySelector("rect")!.style.fill).toBe("var(--t-faint)");
    expect(brand).toHaveAttribute("title", "Drift not measured");
  });

  it("keeps the brand mark when no drift figures are given", () => {
    render(bar(undefined));
    const mark = screen
      .getByRole("button", { name: "FACET Atlas, to the overview" })
      .querySelector("svg")!;
    expect(mark).toHaveAttribute("data-state", "brand");
    expect(blocks(mark)).toEqual(["translateY(0px)", "translateY(22px)"]);
  });

  it("names a standalone drift mark for a screen reader", () => {
    render(
      <>
        <DriftMark share={0.25} />
        <DriftMark share={0} />
        <DriftMark share={null} />
      </>,
    );
    expect(screen.getByRole("img", { name: /^Drift: 25\s?% of records$/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No drift" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Drift not measured" })).toBeInTheDocument();
  });

  it("shows any drift at all as offset, and never more than the brand offset", () => {
    expect([0, 0.001, 0.5, 1, 3, null, Number.NaN].map(driftOffset)).toEqual([
      0,
      6,
      12,
      22,
      22,
      null,
      null,
    ]);
  });

  it("slides to a new offset, and not at all under reduced motion", () => {
    const css = readFileSync(join(__dirname, "..", "styles", "shell.css"), "utf8");
    expect(css).toMatch(/\.t-logo-mark rect \{\s*transition:/);
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css)?.[1];
    expect(reduced).toMatch(/\.t-logo-mark rect \{\s*transition: none;/);
  });
});

describe("mobile reach and unmeasured figures", () => {
  it("offers role, palette and settings in the more sheet", async () => {
    const calls: string[] = [];
    render(
      <MoreSheet
        open
        items={NAV}
        roleName="Leadership"
        roles={ROLES}
        currentRole="leadership"
        theme={{ label: "Light", icon: "sun" }}
        onRole={(k) => calls.push(`role:${k}`)}
        onTheme={() => calls.push("theme")}
        onSettings={() => calls.push("settings")}
      />,
    );
    expect(screen.getByRole("radio", { name: "Leadership" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("radio", { name: "Agent" }));
    await userEvent.click(screen.getByRole("button", { name: "Light" }));
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(calls).toEqual(["role:agent", "theme", "settings"]);
  });

  it("shows unmeasured top bar figures as dashes and drops the menu button without a handler", () => {
    const { rerender } = render(
      <TopBar
        canBack
        canForward={false}
        roleName="x"
        theme={{ label: "Light", icon: "sun" }}
        stats={{ features: null, provenPct: null, drift: null }}
      />,
    );
    expect(screen.getAllByText("—")).toHaveLength(3);
    rerender(
      <TopBar
        compact
        canBack
        canForward={false}
        roleName="x"
        theme={{ label: "Light", icon: "sun" }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
  });

  it("inherits the palette when no theme is given", () => {
    render(<AppShell top={<div />}>Page</AppShell>);
    expect(screen.getByRole("main").parentElement).not.toHaveAttribute("data-t-theme");
  });
});

describe("focus mode", () => {
  const css = readFileSync(join(__dirname, "..", "styles", "shell.css"), "utf8");

  it("marks the shell, so the stylesheet's focus rules apply to it", () => {
    const { container, rerender } = render(
      <AppShell top={<div />}>
        <p>Page</p>
      </AppShell>,
    );
    const shell = container.querySelector(".t-shell") as HTMLElement;
    expect(shell).not.toHaveAttribute("data-focus");
    rerender(
      <AppShell top={<div />} focus>
        <p>Page</p>
      </AppShell>,
    );
    expect(shell).toHaveAttribute("data-focus", "on");
    // The rules key on exactly that attribute: blur for what has neither hover nor
    // focus, a wider page, larger type in the page.
    expect(css).toMatch(/\[data-focus="on"\][\s\S]*:not\(:hover, :focus-within/);
    expect(css).toMatch(/filter: blur\(/);
    expect(css).toMatch(
      /\[data-focus="on"\]\[data-layout="desktop"\] \.t-page \{\s*max-width: min\(1600px, 80vw\)/,
    );
    expect(css).toMatch(/\[data-focus="on"\] \.t-shell__main \{\s*--t-fs-12/);
  });

  it("has no transition under reduced motion", () => {
    const reduced =
      /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    expect(reduced).toMatch(/\[data-focus="on"\][^{]*\{\s*transition: none;/);
  });
});

describe("German locale", () => {
  it("speaks German in the top bar, the history menu and the boot screen under the German locale", () => {
    renderInGerman(
      <>
        <TopBar
          canBack={false}
          canForward={false}
          historyOpen
          history={{ entries: HISTORY }}
          roleName="Entwicklung"
          theme={{ label: "Hell", icon: "sun" }}
        />
        <BootScreen
          phase="records"
          progress={null}
          counts={{ records: null, files: null, anchors: null }}
        />
      </>,
    );
    expect(screen.getByRole("button", { name: de["shell.top.backNone"] })).toBeDisabled();
    expect(screen.getByRole("menu", { name: de["shell.history.label"] })).toBeInTheDocument();
    expect(screen.getByText(de["shell.boot.phase.records"])).toBeInTheDocument();
    expect(de["shell.history.label"]).toBe("Besuchte Orte");
  });
});
