import { render, screen } from "@testing-library/react";
import { de, en, FacetTextProvider, useText, type TextKey } from ".";
import { Pagination } from "../primitives/collection";
import { BootScreen, HistoryMenu, TopBar } from "../shell/Shell";
import { HISTORY } from "../fixtures/shell";

const SAME_IN_GERMAN: ReadonlySet<TextKey> = new Set<TextKey>([
  "shell.history.kind.plugin", // "Plugin" — technical term
  "shell.nav.plugin", // "Plugin" — technical term
  "shell.role.agent.name", // "Agent" — same word in both languages
  "c.hub.k.tests.label", // "Tests" — technical term
  "c.hub.k.anchors.view.treemap", // "Treemap" — technical term
  "c.hub.k.glossary.view.az", // "A–Z"
  "shell.nav.item.records", // "Records" — FACET term
  "shell.boot.records", // "Records" — FACET term, used untranslated in German
  "c.fixed.hash", // "Hash" — technical term
  "c.fixed.records", // "Records" — FACET term
  "c.fixed.ticket", // "Ticket" — same word
]);

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

  it("translate every German value unless it is an allowed technical term", () => {
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

  it("speaks German inside a de provider, with plural forms and German numbers", () => {
    const { rerender } = render(
      <FacetTextProvider locale="de">
        <Probe count={1} />
      </FacetTextProvider>,
    );
    expect(screen.getByTestId("text")).toHaveTextContent("Rolle: Agent");
    expect(screen.getByTestId("plural")).toHaveTextContent("1 älterer");
    expect(screen.getByTestId("number")).toHaveTextContent("12.345");
    rerender(
      <FacetTextProvider locale="de">
        <Probe count={1234} />
      </FacetTextProvider>,
    );
    expect(screen.getByTestId("plural")).toHaveTextContent("1.234 ältere");
  });

  it("leaves a placeholder without a value visible instead of printing undefined", () => {
    render(<Probe count={2} />);
    expect(screen.getByTestId("missing")).toHaveTextContent("1–{{to}} of {{total}}");
  });

  it("lets the app replace single texts and falls back to English text for other locales", () => {
    render(
      <FacetTextProvider locale="fr-FR" dictionary={{ "shell.more.role": "Rôle : {{name}}" }}>
        <Probe count={2} />
      </FacetTextProvider>,
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

  it("switch the shell to German through the provider", () => {
    render(
      <FacetTextProvider locale="de">
        <TopBar
          canBack={false}
          canForward
          roleName="Agent"
          theme={{ label: "Hell", icon: "sun" }}
          stats={{ features: 1234, provenPct: 61, drift: null }}
        />
      </FacetTextProvider>,
    );
    expect(screen.getByRole("button", { name: "Zurück — noch kein früherer Ort" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Vor" })).toBeEnabled();
    expect(screen.getByText("Merkmale")).toBeInTheDocument();
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByText("61 %")).toBeInTheDocument();
  });

  it("name history kinds and boot phases from the dictionary, in both languages", () => {
    const { unmount } = render(<HistoryMenu entries={HISTORY} />);
    expect(screen.getByRole("menuitem", { name: /column/ })).toHaveTextContent("Record");
    unmount();
    render(
      <FacetTextProvider locale="de">
        <HistoryMenu entries={HISTORY} />
        <BootScreen
          phase="index"
          progress={null}
          counts={{ records: 3, files: null, anchors: null }}
        />
      </FacetTextProvider>,
    );
    expect(screen.getByRole("menuitem", { name: /column/ })).toHaveTextContent("Akte");
    expect(screen.getByText("Anker indizieren")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Fortschritt" })).toHaveAttribute(
      "aria-valuetext",
      "Anteil noch unbekannt",
    );
  });
});
