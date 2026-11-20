import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/c-contents/settings.spec.text";
import { fireEvent, render as renderInEnglish, screen, within } from "@testing-library/react";
import { renderInGerman as render } from "../../i18n/testing";
import {
  AiSection,
  ForgeSection,
  GenUiSection,
  LanguageSection,
  PluginDetailSection,
  PluginGrantSection,
  PluginsSection,
  SettingsPage,
  StorageSection,
  ThemeSection,
  type AiSettings,
  type ForgeSettings,
} from "./Settings";
import { grantItems, plugins } from "./data";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cssC = readFileSync(join(__dirname, "..", "..", "styles", "screens-c.css"), "utf8");

describe("SettingsPage", () => {
  it("lists sections beside the open one and reports a pick", () => {
    const onSection = jest.fn();
    render(
      <SettingsPage
        active="language"
        query=""
        badges={{ plugins: { label: localized.text1, tone: "warn" }, ai: { label: "x" } }}
        onSection={onSection}
      >
        <p>{localized.text2}</p>
      </SettingsPage>,
    );
    const nav = screen.getByRole("navigation", { name: germanLabels.text5 });
    expect(within(nav).getByRole("button", { name: /Sprache/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByText(localized.text3)).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: /Plugins/ }));
    expect(onSection).toHaveBeenCalledWith("plugins");
    expect(screen.getByText(localized.text4)).toBeInTheDocument();
  });

  it("filters by query and offers a way out when nothing matches", () => {
    const onQuery = jest.fn();
    const { rerender } = render(
      <SettingsPage
        active="appearance"
        query={labelText.extra20}
        results={["language"]}
        onQuery={onQuery}
      >
        <p>{localized.text5}</p>
      </SettingsPage>,
    );
    expect(within(screen.getByRole("navigation")).getAllByRole("listitem")).toHaveLength(1);
    rerender(
      <SettingsPage active="appearance" query={localized.text6} results={[]} onQuery={onQuery}>
        <p>{localized.text7}</p>
      </SettingsPage>,
    );
    const none = screen.getByTestId("settings-no-results");
    expect(none).toHaveTextContent(localized.text8);
    expect(screen.queryByText(localized.text9)).not.toBeInTheDocument();
    fireEvent.click(within(none).getByRole("button", { name: germanLabels.text28 }));
    fireEvent.click(within(none).getByRole("button", { name: "Plugins" }));
    expect(onQuery.mock.calls).toEqual([[""], ["Plugins"]]);
  });

  it("goes from list to detail and back on mobile", () => {
    const onBack = jest.fn();
    const { rerender } = render(
      <SettingsPage active="ai" mobile query="">
        <p>Detail</p>
      </SettingsPage>,
    );
    expect(screen.queryByText("Detail")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: germanLabels.text5 })).toBeInTheDocument();
    rerender(
      <SettingsPage active="ai" mobile detailOpen query="" onBack={onBack}>
        <p>Detail</p>
      </SettingsPage>,
    );
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text29 }));
    expect(onBack).toHaveBeenCalled();
    expect(screen.getByText("Detail")).toBeInTheDocument();
  });
});

describe("sections", () => {
  it("previews all four palettes live and switches palette, density, motion and surface", () => {
    const onChange = jest.fn();
    render(
      <ThemeSection
        value={{
          theme: "facet",
          mode: "dark",
          followSystem: false,
          density: "normal",
          motion: "system",
          surface: "v3",
        }}
        onChange={onChange}
      />,
    );
    const palettes = within(screen.getByTestId("theme-palettes")).getAllByRole("radio");
    expect(palettes).toHaveLength(4);
    expect(palettes[0]).toHaveAttribute("aria-checked", "true");
    fireEvent.click(palettes[3]);
    fireEvent.click(screen.getByRole("switch", { name: germanLabels.text30 }));
    fireEvent.click(screen.getByRole("radio", { name: labelText.text218 }));
    fireEvent.click(screen.getByRole("radio", { name: labelText.text219 }));
    fireEvent.click(screen.getByRole("radio", { name: "v2" }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { theme: "paper", mode: "light" },
      { followSystem: true },
      { density: "wide" },
      { motion: "reduced" },
      { surface: "v2" },
    ]);
  });

  it("changes language settings and previews dates in the chosen form", () => {
    const onChange = jest.fn();
    const sample = { relative: labelText.text222, absolute: "06.11.2026", number: "1.226" };
    const value = {
      ui: "de" as const,
      content: "record" as const,
      dates: "relative" as const,
      week: "monday" as const,
    };
    const { rerender } = render(
      <LanguageSection value={value} sample={sample} onChange={onChange} />,
    );
    expect(screen.getByTestId("language-preview")).toHaveTextContent(labelText.text222);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    const ui = screen.getByRole("radiogroup", { name: localized.text10 });
    expect(within(ui).getByRole("radio", { name: labelText.text201 })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText(localized.text11, { selector: ".t-c-setrow__label" })).toBeVisible();
    fireEvent.click(within(ui).getByRole("radio", { name: "English" }));
    fireEvent.click(screen.getByRole("radio", { name: labelText.extra21 }));
    fireEvent.click(screen.getByRole("radio", { name: "10.11.2026" }));
    fireEvent.click(screen.getByRole("radio", { name: labelText.text223 }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { ui: "en" },
      { content: "en" },
      { dates: "absolute" },
      { week: "sunday" },
    ]);
    rerender(<LanguageSection value={{ ...value, dates: "absolute" }} sample={sample} />);
    expect(screen.getByTestId("language-preview")).toHaveTextContent("06.11.2026");
  });

  it("shows stored keys with sizes, validates the history limit and clears", () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    render(
      <StorageSection
        value={{
          historyLimit: "500",
          historyCount: 37,
          keepChat: true,
          restoreLast: false,
          error: localized.text12,
          items: [{ key: "atlas.v3.chat", label: "Chat", bytes: 2048, entries: 3 }],
        }}
        onChange={onChange}
        onClear={onClear}
      />,
    );
    expect(screen.getByText(localized.text13)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(localized.text14), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("switch", { name: labelText.text224 }));
    fireEvent.click(screen.getByRole("switch", { name: labelText.text225 }));
    fireEvent.click(screen.getByRole("button", { name: localized.text15 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text31 }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { historyLimit: "100" },
      { restoreLast: true },
      { keepChat: false },
    ]);
    expect(onClear.mock.calls).toEqual([["atlas.v3.chat"], ["*"]]);
    expect(screen.getByText(remainingText.text109)).toBeInTheDocument();
  });

  it("names what each stored key holds and what its button clears", () => {
    const onClear = jest.fn();
    const { rerender } = render(
      <StorageSection
        value={{
          historyLimit: "200",
          historyCount: 4,
          keepChat: true,
          restoreLast: true,
          items: [
            {
              key: "facet.atlas.v3.history",
              label: localized.text16,
              bytes: 400,
              entries: 4,
              contents: labelText.text226,
            },
            {
              key: "atlas6.state",
              label: labelText.text227,
              bytes: 900,
              entries: 1,
              contents: labelText.text228,
            },
          ],
        }}
        onClear={onClear}
      />,
    );
    const rows = screen.getAllByTestId("storage-item");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent(localized.text17);
    expect(within(rows[0]).getByTestId("storage-item-contents")).toHaveTextContent(
      labelText.text226,
    );
    expect(rows[0]).toHaveTextContent("facet.atlas.v3.history");
    expect(within(rows[1]).getByTestId("storage-item-contents")).toHaveTextContent(
      labelText.text228,
    );
    fireEvent.click(within(rows[1]).getByRole("button", { name: remainingText.text110 }));
    expect(onClear).toHaveBeenCalledWith("atlas6.state");
    rerender(
      <StorageSection
        value={{
          historyLimit: "200",
          historyCount: 0,
          keepChat: true,
          restoreLast: true,
          items: [],
        }}
        onClear={onClear}
      />,
    );
    expect(screen.getByRole("button", { name: germanLabels.text33 })).toBeDisabled();
  });

  it("offers focus mode under appearance only where the app has it", () => {
    const onChange = jest.fn();
    const base = {
      theme: "facet" as const,
      mode: "dark" as const,
      followSystem: false,
      density: "normal" as const,
      motion: "system" as const,
      surface: "v3" as const,
    };
    const { rerender } = render(<ThemeSection value={base} onChange={onChange} />);
    expect(screen.queryByRole("switch", { name: labelText.text229 })).not.toBeInTheDocument();
    rerender(<ThemeSection value={{ ...base, focus: false }} onChange={onChange} />);
    const focus = screen.getByRole("switch", { name: labelText.text229 });
    expect(focus).toHaveAttribute("aria-checked", "false");
    fireEvent.click(focus);
    expect(onChange).toHaveBeenLastCalledWith({ focus: true });
  });

  it("says per tool whether its state is settled, changeable or unmeasured", () => {
    render(
      <AiSection
        value={{
          ...ai,
          tools: [
            { name: "Read", allowed: true, fixed: true },
            { name: "mcp__facet__adr_find", allowed: true, fixed: false },
            { name: "Bash", allowed: false, fixed: true },
            { name: labelText.text124, allowed: false },
          ],
        }}
      />,
    );
    const row = (name: string) => screen.getByText(name).closest("li") as HTMLElement;
    expect(within(row("Read")).getByTestId("ai-tool-change")).toHaveTextContent(
      germanLabels.text25,
    );
    expect(within(row("Bash")).getByTestId("ai-tool-change")).toHaveTextContent(
      germanLabels.text25,
    );
    expect(within(row("mcp__facet__adr_find")).getByTestId("ai-tool-change")).toHaveTextContent(
      localized.text18,
    );
    const unknown = within(row(labelText.text124)).getByTestId("ai-tool-change");
    expect(unknown).toHaveTextContent("—");
    expect(unknown).toHaveAttribute("title", localized.text19);
  });

  const ai: AiSettings = {
    state: "ready",
    account: labelText.text230,
    model: "Opus",
    models: ["Opus", "Sonnet"],
    mode: "read",

    tools: [
      { name: "Read", allowed: true },
      { name: "Bash", allowed: false },
    ],
    lastCheck: "14:08",
  };

  it("shows the signed-in agent with its tools, and the login command when signed out", () => {
    const onChange = jest.fn();
    const onCopy = jest.fn();
    const onCheck = jest.fn();
    const { rerender } = render(<AiSection value={ai} onChange={onChange} onCheck={onCheck} />);
    expect(screen.getByTestId("ai-ready")).toHaveTextContent(germanLabels.text34);
    expect(screen.getByText(germanLabels.text35)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: germanLabels.text36 }), {
      target: { value: "Sonnet" },
    });
    fireEvent.click(screen.getByRole("radio", { name: localized.text20 }));
    fireEvent.click(screen.getByRole("button", { name: localized.text21 }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { model: "Sonnet" },
      { mode: "explain" },
    ]);
    expect(onCheck).toHaveBeenCalled();
    rerender(<AiSection value={{ ...ai, state: "signed-out" }} onCopy={onCopy} />);
    const out = screen.getByTestId("ai-signed-out");
    expect(out).toHaveTextContent("$ claude login");
    fireEvent.click(within(out).getByRole("button", { name: germanLabels.text37 }));
    expect(onCopy).toHaveBeenCalledWith("claude login");
  });

  const forge: ForgeSettings = {
    state: "ok",
    remote: "https://github.com/o/r.git",
    provider: "github",
    branch: "main",
    branchPrefix: "atlas/",
    prDraft: true,
    codeLinks: true,
    manualUrl: "",
  };

  it("shows the detected remote, and asks for a URL with validation without one", () => {
    const onChange = jest.fn();
    const onTest = jest.fn();
    const { rerender } = render(<ForgeSection value={forge} onChange={onChange} onTest={onTest} />);
    expect(screen.getByText("https://github.com/o/r.git")).toBeInTheDocument();

    const kv = screen.getByText("https://github.com/o/r.git").closest("dl") as HTMLElement;
    expect(kv.parentElement).toHaveClass("t-c-setgroup");
    const rule = /\n\.t-c-setgroup > \.t-c-kv \{([^}]*)\}/.exec(cssC)?.[1] ?? "";
    expect(rule).toMatch(/padding:\s*\d+px 16px/);
    const row = /\n\.t-c-setrow \{([^}]*)\}/.exec(cssC)?.[1] ?? "";
    expect(row).toMatch(/padding:\s*12px 16px/);
    fireEvent.click(screen.getByRole("radio", { name: "GitLab" }));
    fireEvent.change(screen.getByRole("textbox", { name: localized.text22 }), {
      target: { value: "x/" },
    });
    fireEvent.click(screen.getByRole("switch", { name: remainingText.text111 }));
    fireEvent.click(screen.getByRole("switch", { name: "Code-Referenzen verlinken" }));
    fireEvent.click(screen.getByRole("button", { name: "Link testen" }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { provider: "gitlab" },
      { branchPrefix: "x/" },
      { prDraft: false },
      { codeLinks: false },
    ]);
    expect(onTest).toHaveBeenCalled();
    rerender(
      <ForgeSection
        value={{
          ...forge,
          state: "no-remote",
          manualUrl: "github.com",
          error: localized.text23,
        }}
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId("forge-no-remote")).toHaveTextContent(localized.text24);
    expect(screen.getByText(localized.text25)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Basis-URL"), { target: { value: "https://x/y" } });
    expect(onChange).toHaveBeenLastCalledWith({ manualUrl: "https://x/y" });
    rerender(<ForgeSection value={{ ...forge, state: "no-remote", manualUrl: "" }} />);
    expect(screen.getByRole("button", { name: "Link testen" })).toBeDisabled();
  });

  it("lists plugins with checksum state and open grants", () => {
    const onOpen = jest.fn();
    const onToggle = jest.fn();
    render(<PluginsSection plugins={plugins} onOpen={onOpen} onToggle={onToggle} />);
    expect(screen.getByText(localized.text26)).toBeInTheDocument();
    expect(screen.getByText(localized.text27)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text26 }));
    fireEvent.click(screen.getByRole("switch", { name: "Decisions einschalten" }));
    expect(onOpen).toHaveBeenCalledWith("bpmn");
    expect(onToggle).toHaveBeenCalledWith("adr", false);
  });

  it("shows a plugin's package, what it requests and what is granted, with the grant command", () => {
    const onCopy = jest.fn();
    const onOpenGrant = jest.fn();
    const onBack = jest.fn();
    const bpmn = { ...plugins.find((p) => p.id === "bpmn")!, verification: "mismatch" as const };
    const manifest = {
      entry: "dist/bpmn.js",
      path: ".facet/plugins/bpmn/",
      installedAt: "2026-11-02",
      sidecars: [{ name: "bpmn", sha256: "3f9c1be04a7d22c5e8a9b0f61d7735e2" }],
    };
    const { rerender } = render(
      <PluginDetailSection
        plugin={bpmn}
        manifest={manifest}
        grants={grantItems}
        onCopy={onCopy}
        onOpenGrant={onOpenGrant}
        onBack={onBack}
      />,
    );
    expect(screen.getByText(localized.text28)).toBeInTheDocument();
    expect(within(screen.getByTestId("grant-g3")).getByText(localized.text29)).toBeInTheDocument();
    const open = screen.getByTestId("plugin-open-grants");
    expect(open).toHaveTextContent("$ facet plugin grant bpmn");
    fireEvent.click(within(open).getByRole("button", { name: germanLabels.text37 }));
    fireEvent.click(within(open).getByRole("button", { name: localized.text30 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text38 }));
    expect(onCopy).toHaveBeenCalledWith("facet plugin grant bpmn");
    expect(onOpenGrant).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
    rerender(
      <PluginDetailSection
        plugin={plugins[0]}
        manifest={manifest}
        grants={grantItems.map((g) => ({
          ...g,
          state: g.key === "g3" ? "denied" : "granted",
        }))}
      />,
    );
    expect(screen.queryByTestId("plugin-open-grants")).not.toBeInTheDocument();
    expect(screen.getByText(localized.text33)).toBeInTheDocument();
  });

  it("lets every requested right be granted or denied, and saves only when all are decided", () => {
    const onDecide = jest.fn();
    const onConfirm = jest.fn();
    const token = { valid: true, until: "14:32", origin: "http://127.0.0.1:47811" };
    const { rerender } = render(
      <PluginGrantSection
        plugin={plugins.find((p) => p.id === "bpmn")!}
        items={grantItems}
        decisions={{ g3: "grant" }}
        token={token}
        onDecide={onDecide}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole("button", { name: remainingText.text112 })).toBeDisabled();
    fireEvent.click(
      within(screen.getByRole("radiogroup", { name: "repo.commit entscheiden" })).getByRole(
        "radio",
        { name: labelText.text231 },
      ),
    );
    expect(onDecide).toHaveBeenCalledWith("g3", "deny");
    const all = Object.fromEntries(grantItems.map((g) => [g.key, "grant" as const]));
    rerender(
      <PluginGrantSection
        plugin={plugins.find((p) => p.id === "bpmn")!}
        items={grantItems}
        decisions={all}
        token={token}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: remainingText.text112 }));
    expect(onConfirm).toHaveBeenCalled();
    rerender(
      <PluginGrantSection
        plugin={plugins.find((p) => p.id === "bpmn")!}
        items={grantItems}
        decisions={{}}
        token={{ ...token, valid: false }}
      />,
    );
    expect(screen.getByTestId("grant-token")).toHaveTextContent(localized.text36);
    expect(screen.queryByRole("radio", { name: localized.text37 })).not.toBeInTheDocument();
  });

  it("switches generative UI surfaces and validates the block limit", () => {
    const onChange = jest.fn();
    const value = {
      enabled: true,
      scope: "blocks" as const,
      maxBlocks: "40",
      error: labelText.text232,
      surfaces: [{ key: "chat", label: "Frag Atlas", desc: "d", on: true }],
    };
    const { rerender } = render(<GenUiSection value={value} onChange={onChange} />);
    expect(screen.getByText(labelText.text232)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Frag Atlas" }));
    fireEvent.click(screen.getByRole("radio", { name: labelText.text233 }));
    fireEvent.change(screen.getByLabelText(labelText.text234), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("switch", { name: "Ansichten in Antworten" }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { surfaces: [{ ...value.surfaces[0], on: false }] },
      { scope: "free" },
      { maxBlocks: "6" },
      { enabled: false },
    ]);
    rerender(<GenUiSection value={{ ...value, enabled: false }} />);
    expect(screen.getByRole("switch", { name: "Frag Atlas" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

describe("English", () => {
  it("names the sections and the grant states in English without a provider", () => {
    renderInEnglish(
      <SettingsPage active="appearance" query="">
        <span />
      </SettingsPage>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search settings" })).toBeInTheDocument();
    expect(screen.getByText("History & storage")).toBeInTheDocument();
    expect(screen.getByText("Atlas AI")).toBeInTheDocument();
  });

  it("speaks English in the plugin list", () => {
    renderInEnglish(<PluginsSection plugins={plugins} />);
    expect(screen.getByRole("heading", { name: "Plugins" })).toBeInTheDocument();
    expect(screen.getAllByText("Checksum ok").length).toBeGreaterThan(0);
    expect(screen.getByText("Install and grant in the terminal.")).toBeInTheDocument();
  });
});
