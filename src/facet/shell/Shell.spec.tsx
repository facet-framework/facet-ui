import { labelText } from "../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../i18n/legacy/shared";
import { localized } from "../../i18n/legacy/facet/shell/Shell.spec.text";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, screen } from "@testing-library/react";
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
import { registry } from "../fixtures";

import { renderInGerman as render } from "../i18n/testing";
import { de } from "../i18n/de";

const ROLES = rolesFor((key) => de[key]);

describe("TopBar", () => {
  it("disables back when there is no earlier place and opens the place list", async () => {
    const onHistory = jest.fn();
    render(
      <TopBar
        canBack={false}
        canForward={false}
        historyOpen
        history={{ entries: HISTORY }}
        roleName={labelText.text49}
        theme={{ label: labelText.text50, icon: "sun" }}
        onHistory={onHistory}
      />,
    );
    expect(screen.getByRole("button", { name: localized.text1 })).toBeDisabled();
    expect(screen.getByRole("menu", { name: labelText.text51 })).toHaveTextContent("column");
    await userEvent.click(screen.getByRole("button", { name: labelText.text51 }));
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
    expect(screen.getByText("Records lesen")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", localized.text2);
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
        roleName={labelText.text43}
        roleOpen
        roleMenu={
          <RoleMenu roles={ROLES} current="leadership" onPick={(k) => calls.push(`role:${k}`)} />
        }
        theme={{ label: labelText.text50, icon: "sun" }}
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
    await userEvent.click(screen.getByRole("button", { name: localized.text3 }));
    await userEvent.click(screen.getByRole("button", { name: labelText.text52 }));
    await userEvent.click(screen.getByRole("button", { name: localized.text4 }));
    await userEvent.click(screen.getByRole("button", { name: germanLabels.text96 }));
    await userEvent.click(screen.getByRole("button", { name: labelText.text43 }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: /Agent/ }));
    await userEvent.click(screen.getByRole("button", { name: labelText.text50 }));
    await userEvent.click(screen.getByRole("button", { name: germanLabels.text5 }));
    fireEvent.contextMenu(screen.getByRole("button", { name: localized.text5 }));
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
    expect(screen.getByRole("menuitemradio", { name: labelText.text53 })).toHaveAttribute(
      "aria-checked",
      "true",
    );
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
        theme={{ label: labelText.text54, icon: "moon" }}
        onMenu={onMenu}
        onCommand={onCommand}
        stats={{ features: 1, provenPct: 1, drift: 1 }}
      />,
    );
    expect(screen.queryByRole("button", { name: labelText.text55 })).toBeNull();
    expect(screen.queryByText(localized.text6)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: localized.text7 }));
    await userEvent.click(screen.getByRole("button", { name: germanLabels.text60 }));
    expect(onMenu).toHaveBeenCalled();
    expect(onCommand).toHaveBeenCalled();
  });
});

describe("HistoryMenu", () => {
  const many = Array.from({ length: 40 }, (_, i) => ({
    key: `k${i}`,
    time: "12:00",
    label: `${labelText.text56}${i}`,
    kind: "dossier" as const,
  }));

  it("filters places, counts older ones and clears", async () => {
    const onFilter = jest.fn();
    const onPick = jest.fn();
    const onClear = jest.fn();
    const { rerender } = render(
      <HistoryMenu entries={many} onFilter={onFilter} onPick={onPick} onClear={onClear} />,
    );
    expect(screen.getByText(localized.text8)).toBeInTheDocument();
    await userEvent.type(screen.getByRole("searchbox", { name: labelText.text57 }), "3");
    expect(onFilter).toHaveBeenCalledWith("3");
    await userEvent.click(screen.getByRole("menuitem", { name: labelText.text58 }));
    expect(onPick).toHaveBeenCalledWith("k0");
    await userEvent.click(screen.getByRole("button", { name: germanLabels.text83 }));
    expect(onClear).toHaveBeenCalled();
    rerender(<HistoryMenu entries={many} filter={labelText.text59} />);
    expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(labelText.text59),
        expect.stringContaining(labelText.text60),
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
    expect(screen.getByRole("button", { name: germanLabels.text61 })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: labelText.text61 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Records/ })).toHaveTextContent("11");
    await userEvent.click(screen.getByRole("button", { name: labelText.text62 }));
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
            { key: "overview", label: germanLabels.text7, icon: "home", current: true },
            { key: "records", label: "Records", icon: "records", badge: true },
          ]}
        />
        <MoreSheet open items={NAV} roleName="Agent" onPick={onPick} onClose={onClose} />
      </>,
    );
    await userEvent.click(screen.getAllByRole("button", { name: /Records/ })[0]);
    expect(onPick).toHaveBeenCalledWith("records");
    expect(screen.getByRole("dialog", { name: labelText.text63 })).toHaveTextContent(
      labelText.text64,
    );
    await userEvent.click(screen.getByRole("button", { name: labelText.text65 }));
    expect(onPick).toHaveBeenCalledWith("adr");
  });
});

describe("AppShell", () => {
  it("puts the nav bar on desktop and the tab bar on mobile", () => {
    const { rerender } = render(
      <AppShell
        top={<div>{labelText.text38}</div>}
        nav={<nav aria-label={germanLabels.text97}>n</nav>}
        tabbar={<nav aria-label="Tabs">t</nav>}
      >
        {labelText.text46}
      </AppShell>,
    );
    expect(screen.getByRole("navigation", { name: germanLabels.text97 })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Tabs" })).toBeNull();
    rerender(
      <AppShell
        mobile
        theme={{ theme: "paper", mode: "light" }}
        top={<div>{labelText.text38}</div>}
        nav={<nav aria-label={germanLabels.text97}>n</nav>}
        tabbar={<nav aria-label="Tabs">t</nav>}
      >
        {labelText.text46}
      </AppShell>,
    );
    expect(screen.queryByRole("navigation", { name: germanLabels.text97 })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument();
    expect(screen.getByRole("main").parentElement).toHaveAttribute("data-t-theme", "paper");
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
        error={{ title: localized.text9, reason: "Timeout", onRetry }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: labelText.text66 }));
    expect(onRetry).toHaveBeenCalled();
    render(
      <BootScreen
        phase="connect"
        progress={null}
        counts={{ records: null, files: null, anchors: null }}
        error={{ title: localized.text10, reason: "x" }}
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
    const steps = screen.getByRole("list", { name: labelText.text67 }).querySelectorAll("li");
    expect(Array.from(steps).map((s) => s.getAttribute("data-state"))).toEqual([
      "done",
      "done",
      "done",
      "done",
      "now",
      "next",
      "next",
    ]);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "78 %");
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
      screen.getByRole("img", { name: localized.text11 }).querySelectorAll("rect"),
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
      theme={{ label: labelText.text50, icon: "sun" }}
      stats={stats}
    />
  );
  const blocks = (mark: Element) =>
    [...mark.querySelectorAll("rect")].map((r) => (r as SVGRectElement).style.transform);

  it("offsets the logo's blocks by the measured share of records with drift", () => {
    const { rerender } = render(bar({ features: 10, provenPct: 50, drift: 4, driftShare: 0.5 }));
    const brand = screen.getByRole("button", { name: localized.text12 });
    let mark = brand.querySelector("svg")!;
    expect(mark).toHaveAttribute("data-state", "drift");

    expect(blocks(mark)).toEqual(["translateY(5px)", "translateY(17px)"]);
    expect(brand).toHaveAttribute("title", expect.stringMatching(localized.text13));

    rerender(bar({ features: 10, provenPct: 50, drift: 0, driftShare: 0 }, true));
    mark = screen.getByRole("button", { name: localized.text14 }).querySelector("svg")!;
    expect(mark).toHaveAttribute("data-state", "level");
    expect(blocks(mark)).toEqual(["translateY(11px)", "translateY(11px)"]);
  });

  it("never draws an unmeasured drift as level blocks", () => {
    render(bar({ features: 10, provenPct: 50, drift: null, driftShare: 0 }));
    const brand = screen.getByRole("button", { name: localized.text15 });
    const mark = brand.querySelector("svg")!;
    expect(mark).toHaveAttribute("data-state", "unmeasured");
    expect(blocks(mark)).toEqual(["translateY(0px)", "translateY(22px)"]);
    expect(mark.querySelector("rect")!.style.fill).toBe("var(--t-faint)");
    expect(brand).toHaveAttribute("title", localized.text16);
  });

  it("keeps the brand mark when no drift figures are given", () => {
    render(bar(undefined));
    const mark = screen.getByRole("button", { name: localized.text17 }).querySelector("svg")!;
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
    expect(screen.getByRole("img", { name: localized.text18 })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: localized.text19 })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: localized.text20 })).toBeInTheDocument();
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
        roleName={labelText.text68}
        roles={ROLES}
        currentRole="leadership"
        theme={{ label: labelText.text50, icon: "sun" }}
        onRole={(k) => calls.push(`role:${k}`)}
        onTheme={() => calls.push("theme")}
        onSettings={() => calls.push("settings")}
      />,
    );
    expect(screen.getByRole("radio", { name: labelText.text68 })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("radio", { name: "Agent" }));
    await userEvent.click(screen.getByRole("button", { name: labelText.text50 }));
    await userEvent.click(screen.getByRole("button", { name: germanLabels.text5 }));
    expect(calls).toEqual(["role:agent", "theme", "settings"]);
  });

  it("shows unmeasured top bar figures as dashes and drops the menu button without a handler", () => {
    const { rerender } = render(
      <TopBar
        canBack
        canForward={false}
        roleName="x"
        theme={{ label: labelText.text50, icon: "sun" }}
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
        theme={{ label: labelText.text50, icon: "sun" }}
      />,
    );
    expect(screen.queryByRole("button", { name: localized.text21 })).toBeNull();
  });

  it("inherits the palette when no theme is given", () => {
    render(<AppShell top={<div />}>{labelText.text46}</AppShell>);
    expect(screen.getByRole("main").parentElement).not.toHaveAttribute("data-t-theme");
  });
});

describe("focus mode", () => {
  const css = readFileSync(join(__dirname, "..", "styles", "shell.css"), "utf8");

  it("marks the shell, so the stylesheet's focus rules apply to it", () => {
    const { container, rerender } = render(
      <AppShell top={<div />}>
        <p>{labelText.text46}</p>
      </AppShell>,
    );
    const shell = container.querySelector(".t-shell") as HTMLElement;
    expect(shell).not.toHaveAttribute("data-focus");
    rerender(
      <AppShell top={<div />} focus>
        <p>{labelText.text46}</p>
      </AppShell>,
    );
    expect(shell).toHaveAttribute("data-focus", "on");

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
