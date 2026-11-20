import { createText as createGermanText } from "./text";
import { render, screen } from "@testing-library/react";
import { de, en, TextProvider, useText, type TextKey } from ".";
import { Pagination } from "../primitives/collection";
import { BootScreen, HistoryMenu, TopBar } from "../shell/Shell";
import { HISTORY } from "../fixtures/shell";

const germanText = createGermanText("de");

/**
 * Keys whose German text may equal the English one, because the word is a
 * technical term or a product name that German keeps as it is.
 */
const SAME_IN_GERMAN: ReadonlySet<TextKey> = new Set<TextKey>([
  "shell.history.kind.plugin", // "Plugin" — technical term
  "shell.nav.plugin", // "Plugin" — technical term
  "shell.role.agent.name", // "Agent" — same word in both languages
  "shell.nav.item.records", // "Records" — FACET term
  "shell.boot.records", // "Records" — FACET term, used untranslated in German
  "core.label.testKind.integration", // "Integration" — same word
  "core.focus.label.record", // "Record" — FACET term
  "core.focus.label.test", // "Test" — same word
  "core.roles.gov.tag", // "COMPLIANCE" — same word
  "core.roles.gov.title", // "Compliance" — same word
  "core.companion.fact.team", // "TEAM" — same word
  "core.companion.fact.code", // "CODE" — same word
  "core.companion.fact.teams", // "TEAMS" — same word
  "elements.anchorMap.head", // only placeholders around "in"
  "elements.groupTiles.caption", // only placeholders around "in"
  "elements.indexProgress.registry", // "Registry {{name}}" — FACET term
  "elements.seal.stripe", // only placeholders
  "elements.signalStack.slos.one", // "SLO" — same word
  "elements.signalStack.slos.other", // "SLOs" — same word
]);

/** Fewer keys than this means the guard read the wrong thing, not that all is well. */
const MIN_KEYS = 60;

describe("dictionaries", () => {
  const enKeys = Object.keys(en).sort();
  const deKeys = Object.keys(de).sort();

  it("read enough keys to mean something", () => {
    expect(enKeys.length).toBeGreaterThan(MIN_KEYS);
    expect(deKeys.length).toBeGreaterThan(MIN_KEYS);
  });

  it("carry the same key set in en and de", () => {
    expect(deKeys).toEqual(enKeys);
  });

  it("translate every German value unless it is an allowed technical term under the German locale", () => {
    const untranslated = (enKeys as TextKey[]).filter(
      (k) => de[k] === en[k] && !SAME_IN_GERMAN.has(k),
    );
    expect(untranslated).toEqual([]);
  });

  it("keep the allowlist honest: every entry exists and really is equal", () => {
    for (const k of SAME_IN_GERMAN) {
      expect(en[k]).toBeDefined();
      expect(de[k]).toBe(en[k]);
    }
  });

  it("use the same placeholders in both languages", () => {
    const names = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort();
    for (const k of enKeys as TextKey[]) expect([k, names(de[k])]).toEqual([k, names(en[k])]);
  });
});

function Probe({ count }: { count: number }) {
  const { t, plural, number, locale } = useText();
  return (
    <div data-testid="probe">
      <span data-testid="locale">{locale}</span>
      <span data-testid="text">{t("shell.more.role", { name: "Agent" })}</span>
      <span data-testid="plural">{plural("shell.history.older", count)}</span>
      <span data-testid="number">{number(12345)}</span>
      <span data-testid="missing">{t("primitives.pager.range", { from: 1 })}</span>
    </div>
  );
}

describe("useText", () => {
  it("speaks English without a provider", () => {
    render(<Probe count={2} />);
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("text")).toHaveTextContent("Role: Agent");
    expect(screen.getByTestId("number")).toHaveTextContent("12,345");
  });

  it("speaks German inside a de provider, with plural forms and German numbers under the German locale", () => {
    const { rerender } = render(
      <TextProvider locale="de">
        <Probe count={1} />
      </TextProvider>,
    );
    expect(screen.getByTestId("text")).toHaveTextContent(
      germanText.t("shell.more.role", { name: germanText.t("shell.role.agent.name") }),
    );
    expect(screen.getByTestId("plural")).toHaveTextContent(
      germanText.t("shell.history.older.one", { count: "1" }),
    );
    expect(screen.getByTestId("number")).toHaveTextContent("12.345");
    rerender(
      <TextProvider locale="de">
        <Probe count={1234} />
      </TextProvider>,
    );
    expect(screen.getByTestId("plural")).toHaveTextContent(
      germanText.t("shell.history.older.other", { count: "1.234" }),
    );
  });

  it("leaves a placeholder without a value visible instead of printing undefined", () => {
    render(<Probe count={2} />);
    expect(screen.getByTestId("missing")).toHaveTextContent("1–{{to}} of {{total}}");
  });

  it("lets the app replace single texts and falls back to English text for other locales", () => {
    render(
      <TextProvider locale="fr-FR" dictionary={{ "shell.more.role": "Rôle : {{name}}" }}>
        <Probe count={2} />
      </TextProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("fr-FR");
    expect(screen.getByTestId("text")).toHaveTextContent("Rôle : Agent");
    expect(screen.getByTestId("plural")).toHaveTextContent("2 older");
  });
});

describe("components reach the dictionary", () => {
  it("render English by default", () => {
    render(<Pagination page={2} pageSize={25} total={1200} />);
    expect(screen.getByRole("navigation", { name: "Pages" })).toHaveTextContent("26–50 of 1,200");
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 48" })).toBeInTheDocument();
  });

  it("switch the shell to German through the provider under the German locale", () => {
    render(
      <TextProvider locale="de">
        <TopBar
          canBack={false}
          canForward
          roleName="Agent"
          theme={{ label: germanText.t("shell.theme.light"), icon: "sun" }}
          stats={{ features: 1234, provenPct: 61, drift: null }}
        />
      </TextProvider>,
    );
    expect(screen.getByRole("button", { name: germanText.t("shell.top.backNone") })).toBeDisabled();
    expect(screen.getByRole("button", { name: germanText.t("shell.top.forward") })).toBeEnabled();
    expect(screen.getByText(germanText.t("shell.top.features"))).toBeInTheDocument();
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByText("61 %")).toBeInTheDocument();
  });

  it("name history kinds and boot phases from the dictionary, in both languages", () => {
    const { unmount } = render(<HistoryMenu entries={HISTORY} />);
    expect(screen.getByRole("menuitem", { name: /adr-plugin/ })).toHaveTextContent("Record");
    unmount();
    render(
      <TextProvider locale="de">
        <HistoryMenu entries={HISTORY} />
        <BootScreen
          phase="index"
          progress={null}
          counts={{ records: 3, files: null, anchors: null }}
        />
      </TextProvider>,
    );
    expect(screen.getByRole("menuitem", { name: /adr-plugin/ })).toHaveTextContent(
      germanText.t("shell.history.kind.record"),
    );
    expect(screen.getByText(germanText.t("shell.boot.phase.index"))).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: germanText.t("shell.boot.progress") }),
    ).toHaveAttribute("aria-valuetext", germanText.t("shell.boot.shareUnknown"));
  });
});
