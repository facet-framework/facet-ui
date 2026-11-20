import { labelText } from "../../../i18n/legacy/labels";
import type { ReactNode } from "react";
import { Button, Chip, Field, SearchField, Segment, Switch } from "../../primitives/controls";
import { EmptyState } from "../../primitives/display";
import { Icon, type IconName } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import type { TextKey } from "../../i18n/en";
import { KeyValues } from "./frame";
import type { GrantItem, PluginRow, SettingsSectionKey } from "./model";

export const SETTINGS_SECTIONS: {
  key: SettingsSectionKey;
  label: TextKey | null;
  name?: string;
  icon: IconName;
  sub: TextKey;
}[] = [
  { key: "appearance", label: "c.set.theme.title", icon: "theme", sub: "c.set.nav.themeSub" },
  { key: "language", label: "c.set.lang.title", icon: "globe", sub: "c.set.nav.langSub" },
  { key: "history", label: "c.set.nav.storage", icon: "history", sub: "c.set.nav.storageSub" },
  { key: "ai", label: "c.set.nav.ai", icon: "spark", sub: "c.set.nav.aiSub" },
  { key: "forge", label: null, name: "Git-Forge", icon: "branch", sub: "c.set.nav.forgeSub" },
  { key: "plugins", label: null, name: "Plugins", icon: "plug", sub: "c.set.nav.pluginsSub" },
  { key: "genui", label: null, name: "Generative UI", icon: "grid", sub: "c.set.nav.genuiSub" },
];

export function sectionLabel(
  s: (typeof SETTINGS_SECTIONS)[number] | undefined,
  t: (key: TextKey) => string,
): string | undefined {
  if (!s) return undefined;
  return s.label ? t(s.label) : s.name;
}

export type SettingsPageProps = {
  active: SettingsSectionKey;
  mobile?: boolean;

  detailOpen?: boolean;
  query: string;

  results?: SettingsSectionKey[] | null;
  badges?: Partial<Record<SettingsSectionKey, { label: string; tone?: "warn" | "bad" | "ok" }>>;
  onQuery?: (q: string) => void;
  onSection?: (key: SettingsSectionKey) => void;
  onBack?: () => void;
  children?: ReactNode;
};

export function SettingsPage(p: SettingsPageProps) {
  const { t } = useText();
  const visible = p.results
    ? SETTINGS_SECTIONS.filter((s) => p.results?.includes(s.key))
    : SETTINGS_SECTIONS;
  const noResults = p.results != null && p.results.length === 0;
  const current = SETTINGS_SECTIONS.find((s) => s.key === p.active);
  const nav = (
    <nav className="t-c-set__nav" aria-label={t("c.set.title")}>
      <SearchField
        label={t("c.set.search")}
        value={p.query}
        placeholder={t("c.set.searchPlaceholder")}
        onChange={p.onQuery}
      />
      {noResults ? (
        <div data-testid="settings-no-results">
          <EmptyState
            plain
            icon="search"
            title={t("c.set.noResult", { query: p.query })}
            body={t("c.set.noResultBody")}
            action={
              <>
                <Button size="small" icon="close" onClick={() => p.onQuery?.("")}>
                  {t("c.set.clearSearch")}
                </Button>
                {["Theme", t("c.set.lang.title"), "Plugins"].map((s) => (
                  <Chip key={s} onClick={() => p.onQuery?.(s)}>
                    {s}
                  </Chip>
                ))}
              </>
            }
          />
        </div>
      ) : (
        <ul className="t-c-plain t-c-set__list">
          {visible.map((s) => {
            const b = p.badges?.[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  className="t-c-set__item"
                  aria-current={!p.mobile && s.key === p.active ? "page" : undefined}
                  onClick={() => p.onSection?.(s.key)}
                >
                  <span className="t-c-tile__icon">
                    <Icon name={s.icon} size={16} />
                  </span>
                  <span className="t-stack" style={{ gap: 0, flex: 1, minWidth: 0 }}>
                    <span>{sectionLabel(s, t)}</span>
                    <span className="t-c-small t-muted t-ellipsis">{t(s.sub)}</span>
                  </span>
                  {b ? (
                    <span className={`t-badge${b.tone ? ` t-badge--${b.tone}` : ""}`}>
                      {b.label}
                    </span>
                  ) : null}
                  {p.mobile ? <Icon name="chevronRight" size={14} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
  if (p.mobile) {
    return (
      <div className="t-page t-c-set t-c-set--mobile" data-testid="settings-page">
        {p.detailOpen ? (
          <>
            <button type="button" className="t-c-back" onClick={p.onBack}>
              <Icon name="back" size={14} /> {t("c.set.title")}
            </button>
            <div className="t-anim-rise">{p.children}</div>
          </>
        ) : (
          <>
            <h1 className="t-h1">{t("c.set.title")}</h1>
            {nav}
          </>
        )}
      </div>
    );
  }
  return (
    <div className="t-page t-c-set" data-testid="settings-page">
      <div className="t-c-set__layout">
        <div className="t-stack">
          <h1 className="t-h1">{t("c.set.title")}</h1>
          {nav}
        </div>
        <div className="t-c-set__main t-anim-rise" aria-label={sectionLabel(current, t)}>
          {noResults ? null : p.children}
        </div>
      </div>
    </div>
  );
}

export function SettingsSection({
  title,
  sub,
  children,
  actions,
}: {
  title: string;
  sub?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="t-c-set__section" aria-label={title}>
      <header className="t-row t-row--wrap">
        <div className="t-stack" style={{ gap: 2, flex: 1 }}>
          <h2 className="t-h2">{title}</h2>
          {sub ? <span className="t-c-small t-muted">{sub}</span> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function SettingRow({
  label,
  desc,
  control,
  stacked,
}: {
  label: ReactNode;
  desc?: ReactNode;
  control: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "t-c-setrow t-c-setrow--stacked" : "t-c-setrow"}>
      <div className="t-stack" style={{ gap: 2, minWidth: 0 }}>
        <span className="t-c-setrow__label">{label}</span>
        {desc ? <span className="t-c-small t-muted">{desc}</span> : null}
      </div>
      <div className="t-c-setrow__control">{control}</div>
    </div>
  );
}

function Group({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="t-surface t-c-setgroup">
      {title ? <div className="t-c-setgroup__title t-label">{title}</div> : null}
      {children}
    </div>
  );
}

function Command({
  text,
  label,
  onCopy,
}: {
  text: string;
  label?: string;
  onCopy?: (t: string) => void;
}) {
  const { t } = useText();
  return (
    <div className="t-c-cmd">
      <code className="t-mono">$ {text}</code>
      <Button
        size="small"
        variant="quiet"
        icon="copy"
        aria-label={label ?? t("c.set.copyCommand")}
        onClick={() => onCopy?.(text)}
      />
    </div>
  );
}

export type Appearance = {
  theme: "facet" | "paper";
  mode: "dark" | "light";
  followSystem: boolean;
  density: "compact" | "normal" | "wide";
  motion: "system" | "full" | "reduced";
  surface: "v2" | "v3";

  focus?: boolean;
};

const PALETTES: { theme: Appearance["theme"]; mode: Appearance["mode"]; name: string }[] = [
  { theme: "facet", mode: "dark", name: "FACET design system" },
  { theme: "facet", mode: "light", name: "FACET design system" },
  { theme: "paper", mode: "dark", name: labelText.text200 },
  { theme: "paper", mode: "light", name: labelText.text200 },
];
const MODE_LABEL: Record<Appearance["mode"], TextKey> = {
  dark: "c.set.theme.dark",
  light: "c.set.theme.light",
};

function PalettePreview({ theme, mode }: { theme: string; mode: string }) {
  return (
    <span className="t-c-palette" data-t-theme={theme} data-t-mode={mode} aria-hidden="true">
      <span className="t-c-palette__bar">
        <span className="t-c-palette__logo" />
        <span className="t-c-palette__line" style={{ width: "34%" }} />
        <span className="t-c-palette__pill" />
      </span>
      <span className="t-c-palette__body">
        <span className="t-c-palette__big">94</span>
        <span className="t-c-palette__card">
          <span className="t-c-palette__line" style={{ width: "70%" }} />
          <span className="t-c-palette__meter">
            <span />
          </span>
          <span className="t-c-palette__dots">
            <i style={{ background: "var(--t-ok)" }} />
            <i style={{ background: "var(--t-warn)" }} />
            <i style={{ background: "var(--t-plan)" }} />
            <i style={{ background: "var(--t-bad)" }} />
          </span>
        </span>
      </span>
    </span>
  );
}

export function ThemeSection({
  value,
  onChange,
}: {
  value: Appearance;
  onChange?: (patch: Partial<Appearance>) => void;
}) {
  const { t } = useText();
  return (
    <SettingsSection title={t("c.set.theme.title")} sub={t("c.set.thisBrowser")}>
      <div
        className="t-c-palettes"
        role="radiogroup"
        aria-label="Palette"
        data-testid="theme-palettes"
      >
        {PALETTES.map((pl) => {
          const on = pl.theme === value.theme && pl.mode === value.mode;
          return (
            <button
              key={`${pl.theme}-${pl.mode}`}
              type="button"
              role="radio"
              aria-checked={on}
              className="t-c-palette-opt"
              onClick={() => onChange?.({ theme: pl.theme, mode: pl.mode })}
            >
              <PalettePreview theme={pl.theme} mode={pl.mode} />
              <span className="t-row">
                <span className="t-c-radio" aria-hidden="true" data-on={on || undefined} />
                <span>
                  {pl.name} · {t(MODE_LABEL[pl.mode])}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <Group>
        <SettingRow
          label={t("c.set.theme.follow")}
          desc={t("c.set.theme.followDesc")}
          control={
            <Switch
              label={t("c.set.theme.follow")}
              checked={value.followSystem}
              onChange={(v) => onChange?.({ followSystem: v })}
            />
          }
        />
        {value.focus != null ? (
          <SettingRow
            label={t("c.set.theme.focus")}
            desc={t("c.set.theme.focusDesc")}
            control={
              <Switch
                label={t("c.set.theme.focus")}
                checked={value.focus}
                onChange={(v) => onChange?.({ focus: v })}
              />
            }
          />
        ) : null}
        <SettingRow
          label={t("c.set.theme.density")}
          control={
            <Segment
              label={t("c.set.theme.density")}
              value={value.density}
              options={[
                { value: "compact", label: t("c.set.theme.compact") },
                { value: "normal", label: "Normal" },
                { value: "wide", label: t("c.set.theme.wide") },
              ]}
              onChange={(v) => onChange?.({ density: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.theme.motion")}
          desc={t("c.set.theme.motionDesc")}
          control={
            <Segment
              label={t("c.set.theme.motion")}
              value={value.motion}
              options={[
                { value: "system", label: "System" },
                { value: "full", label: t("c.set.theme.full") },
                { value: "reduced", label: t("c.set.theme.reduced") },
              ]}
              onChange={(v) => onChange?.({ motion: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.theme.surface")}
          desc={t("c.set.theme.surfaceDesc")}
          control={
            <Segment
              label={t("c.set.theme.surface")}
              value={value.surface}
              options={[
                { value: "v2", label: "v2" },
                { value: "v3", label: "v3" },
              ]}
              onChange={(v) => onChange?.({ surface: v })}
            />
          }
        />
      </Group>
    </SettingsSection>
  );
}

export type LanguageSettings = {
  ui: "de" | "en";
  content: "record" | "de" | "en";
  dates: "relative" | "absolute";
  week: "monday" | "sunday";
};

export function LanguageSection({
  value,
  sample,
  onChange,
}: {
  value: LanguageSettings;
  sample: { relative: string; absolute: string; number: string };
  onChange?: (patch: Partial<LanguageSettings>) => void;
}) {
  const { t } = useText();
  return (
    <SettingsSection title={t("c.set.lang.title")} sub={t("c.set.lang.sub")}>
      <Group>
        <SettingRow
          label={t("c.set.lang.ui")}
          control={
            <Segment
              label={t("c.set.lang.ui")}
              value={value.ui}
              options={[
                { value: "de", label: labelText.text201 },
                { value: "en", label: "English" },
              ]}
              onChange={(v) => onChange?.({ ui: v })}
            />
          }
        />
        <SettingRow
          label={t("c.frame.contents")}
          desc={t("c.set.lang.contentDesc")}
          control={
            <Segment
              label={t("c.set.lang.content")}
              value={value.content}
              options={[
                { value: "record", label: t("c.set.lang.asRecord") },
                { value: "de", label: t("c.set.lang.german") },
                { value: "en", label: t("c.set.lang.english") },
              ]}
              onChange={(v) => onChange?.({ content: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.lang.dates")}
          control={
            <Segment
              label={t("c.set.lang.dates")}
              value={value.dates}
              options={[
                { value: "relative", label: t("c.age.days", { count: 3 }) },
                { value: "absolute", label: t("c.set.lang.absoluteSample") },
              ]}
              onChange={(v) => onChange?.({ dates: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.lang.week")}
          control={
            <Segment
              label={t("c.set.lang.week")}
              value={value.week}
              options={[
                { value: "monday", label: t("c.set.lang.monday") },
                { value: "sunday", label: t("c.set.lang.sunday") },
              ]}
              onChange={(v) => onChange?.({ week: v })}
            />
          }
        />
      </Group>
      <Group title={t("c.set.lang.preview")}>
        <div className="t-c-preview" data-testid="language-preview">
          <span>
            {t("c.set.lang.previewDrift")} <span className="t-mono">internal/facet/config.go</span>
          </span>
          <span className="t-meta">
            {value.dates === "relative" ? sample.relative : sample.absolute}
          </span>
          <span className="t-num">{t("c.set.lang.previewLines", { lines: sample.number })}</span>
        </div>
      </Group>
    </SettingsSection>
  );
}

export type StorageSettings = {
  historyLimit: string;
  historyCount: number;
  keepChat: boolean;
  restoreLast: boolean;
  items: StorageItem[];
  error?: string;
};

export type StorageItem = {
  key: string;

  label: string;
  bytes: number;
  entries: number;

  contents?: string;
};

export function StorageSection({
  value,
  onChange,
  onClear,
}: {
  value: StorageSettings;
  onChange?: (patch: Partial<StorageSettings>) => void;
  onClear?: (key: string) => void;
}) {
  const { t, number, locale } = useText();
  const oneDecimal = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const kb = (bytes: number) => `${oneDecimal.format(bytes / 1024)} KB`;
  const total = value.items.reduce((a, i) => a + i.bytes, 0);
  return (
    <SettingsSection title={t("c.set.nav.storage")} sub={t("c.set.storage.sub")}>
      <Group>
        <SettingRow
          label={t("c.set.storage.places")}
          desc={t("c.set.storage.placesDesc", {
            count: value.historyCount,
            limit: value.historyLimit || "—",
          })}
          control={
            <Field label={t("c.set.storage.limit")} error={value.error}>
              {(id) => (
                <input
                  id={id}
                  className="t-input t-c-num-input"
                  inputMode="numeric"
                  value={value.historyLimit}
                  aria-invalid={!!value.error || undefined}
                  onChange={(e) => onChange?.({ historyLimit: e.target.value })}
                />
              )}
            </Field>
          }
        />
        <SettingRow
          label={t("c.set.storage.restoreLast")}
          control={
            <Switch
              label={t("c.set.storage.restore")}
              checked={value.restoreLast}
              onChange={(v) => onChange?.({ restoreLast: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.storage.keepChat")}
          desc={t("c.set.storage.keepChatDesc")}
          control={
            <Switch
              label={t("c.set.storage.keepChat")}
              checked={value.keepChat}
              onChange={(v) => onChange?.({ keepChat: v })}
            />
          }
        />
      </Group>
      <Group title={t("c.set.storage.savedHere", { size: kb(total) })}>
        <ul className="t-c-plain" data-testid="storage-items">
          {value.items.map((i) => {
            const contents = i.contents ?? t("c.ops.entries", { count: number(i.entries) });
            return (
              <li key={i.key} className="t-c-setrow" data-testid="storage-item">
                <div className="t-stack" style={{ gap: 2, minWidth: 0 }}>
                  <span className="t-c-setrow__label t-wrap">{i.label}</span>
                  <span className="t-row t-row--wrap" style={{ gap: 6 }}>
                    <span className="t-badge t-badge--plain" data-testid="storage-item-contents">
                      {contents}
                    </span>
                    <span className="t-meta t-wrap">
                      {kb(i.bytes)} · <span className="t-mono">{i.key}</span>
                    </span>
                  </span>
                </div>
                <Button
                  size="small"
                  variant="quiet"
                  icon="trash"
                  aria-label={t("c.set.storage.clearWhat", { what: i.label, contents })}
                  onClick={() => onClear?.(i.key)}
                >
                  {t("c.set.storage.clear")}
                </Button>
              </li>
            );
          })}
        </ul>
      </Group>
      <div className="t-row">
        <span className="t-spacer" />
        <Button
          variant="danger"
          icon="trash"
          disabled={!value.items.length}
          onClick={() => onClear?.("*")}
        >
          {t("c.set.storage.resetAllCount", {
            count: number(value.items.length),
            size: kb(total),
          })}
        </Button>
      </div>
    </SettingsSection>
  );
}

export type AiSettings = {
  state: "ready" | "signed-out";
  account?: string;
  model: string;
  models: string[];
  mode: "read" | "explain";

  tools: { name: string; allowed: boolean; fixed?: boolean }[];
  lastCheck: string;
};

export function AiSection({
  value,
  onChange,
  onCheck,
  onCopy,
}: {
  value: AiSettings;
  onChange?: (patch: Partial<AiSettings>) => void;
  onCheck?: () => void;
  onCopy?: (t: string) => void;
}) {
  const { t } = useText();
  const signedOut = value.state === "signed-out";
  return (
    <SettingsSection
      title={t("c.set.nav.ai")}
      sub={t("c.set.ai.sub")}
      actions={
        <Button size="small" icon="refresh" onClick={onCheck}>
          {t("c.set.recheck")}
        </Button>
      }
    >
      {signedOut ? (
        <div className="t-c-banner t-c-banner--warn" role="status" data-testid="ai-signed-out">
          <Icon name="lock" size={18} />
          <div className="t-stack" style={{ gap: 6, flex: 1 }}>
            <span className="t-h3">{t("c.set.ai.signedOut")}</span>
            <span className="t-c-small">{t("c.set.ai.signInHint")}</span>
            <Command text="claude login" onCopy={onCopy} />
            <span className="t-meta">{t("c.set.lastChecked", { when: value.lastCheck })}</span>
          </div>
        </div>
      ) : (
        <div className="t-c-banner t-c-banner--ok" role="status" data-testid="ai-ready">
          <Icon name="check" size={18} />
          <div className="t-stack" style={{ gap: 2, flex: 1 }}>
            <span className="t-h3">{t("c.set.ai.signedIn")}</span>
            <span className="t-meta">
              {value.account} · {t("c.set.checked", { when: value.lastCheck })}
            </span>
          </div>
        </div>
      )}
      <fieldset className="t-c-fieldset" disabled={signedOut}>
        <Group>
          <SettingRow
            label={t("c.set.ai.model")}
            control={
              <select
                className="t-select"
                aria-label={t("c.set.ai.model")}
                value={value.model}
                onChange={(e) => onChange?.({ model: e.target.value })}
              >
                {value.models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            }
          />
          <SettingRow
            label={t("c.set.ai.mode")}
            control={
              <Segment
                label={t("c.set.ai.mode")}
                value={value.mode}
                options={[
                  { value: "read", label: t("c.set.ai.read") },
                  { value: "explain", label: t("c.set.ai.explain") },
                ]}
                onChange={(v) => onChange?.({ mode: v })}
              />
            }
          />
        </Group>
        <Group title={t("c.set.ai.tools")}>
          <ul className="t-c-plain t-c-tools">
            {value.tools.map((tool) => (
              <li key={tool.name} className="t-row">
                <Icon
                  name={tool.allowed ? "check" : "lock"}
                  size={14}
                  className={tool.allowed ? "t-ok" : "t-muted"}
                />
                <span className="t-mono">{tool.name}</span>
                <span className="t-spacer" />
                <span className={tool.allowed ? "t-badge t-badge--ok" : "t-badge t-badge--plain"}>
                  {tool.allowed ? t("c.set.ai.allowed") : t("c.set.ai.blocked")}
                </span>
                {tool.fixed == null ? (
                  <span
                    className="t-meta t-c-tools__change"
                    title={t("c.notMeasured")}
                    data-testid="ai-tool-change"
                  >
                    —
                  </span>
                ) : (
                  <span
                    className="t-meta t-c-tools__change"
                    data-testid="ai-tool-change"
                    data-fixed={tool.fixed || undefined}
                  >
                    <Icon name={tool.fixed ? "lock" : "edit"} size={12} />
                    {tool.fixed ? t("c.set.ai.fixed") : t("c.set.ai.changeable")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Group>
      </fieldset>
    </SettingsSection>
  );
}

export type ForgeSettings = {
  state: "ok" | "no-remote";
  remote: string;
  provider: "github" | "gitlab" | "gitea" | "other";
  branch: string;
  branchPrefix: string;
  prDraft: boolean;
  codeLinks: boolean;
  manualUrl: string;
  error?: string;
};

export function ForgeSection({
  value,
  onChange,
  onCopy,
  onTest,
}: {
  value: ForgeSettings;
  onChange?: (patch: Partial<ForgeSettings>) => void;
  onCopy?: (t: string) => void;
  onTest?: () => void;
}) {
  const { t } = useText();
  const none = value.state === "no-remote";
  return (
    <SettingsSection title="Git-Forge" sub={t("c.set.forge.sub")}>
      {none ? (
        <div className="t-c-banner t-c-banner--warn" role="status" data-testid="forge-no-remote">
          <Icon name="warning" size={18} />
          <div className="t-stack" style={{ gap: 6, flex: 1 }}>
            <span className="t-h3">{t("c.set.forge.noRemote")}</span>
            <span className="t-c-small">{t("c.set.forge.noRemoteBody")}</span>
            <Command text="git remote add origin <url>" onCopy={onCopy} />
          </div>
        </div>
      ) : (
        <Group title={t("c.set.forge.detected")}>
          <KeyValues
            items={[
              [
                "Remote",
                <span className="t-mono" key="r">
                  {value.remote}
                </span>,
              ],
              ["Forge", value.provider],
              [
                "Branch",
                <span className="t-mono" key="b">
                  {value.branch}
                </span>,
              ],
            ]}
          />
        </Group>
      )}
      <Group>
        {none ? (
          <SettingRow
            stacked
            label={t("c.set.forge.manualUrl")}
            desc={t("c.set.forge.manualUrlDesc")}
            control={
              <Field label={t("c.set.forge.baseUrl")} error={value.error}>
                {(id) => (
                  <input
                    id={id}
                    className="t-input"
                    placeholder="https://github.com/owner/repo"
                    value={value.manualUrl}
                    aria-invalid={!!value.error || undefined}
                    onChange={(e) => onChange?.({ manualUrl: e.target.value })}
                  />
                )}
              </Field>
            }
          />
        ) : null}
        <SettingRow
          label="Forge"
          control={
            <Segment
              label="Forge"
              value={value.provider}
              options={[
                { value: "github", label: "GitHub" },
                { value: "gitlab", label: "GitLab" },
                { value: "gitea", label: "Gitea" },
                { value: "other", label: t("c.set.forge.other") },
              ]}
              onChange={(v) => onChange?.({ provider: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.forge.prefix")}
          control={
            <input
              className="t-input t-mono"
              aria-label={t("c.set.forge.prefix")}
              value={value.branchPrefix}
              disabled={none}
              onChange={(e) => onChange?.({ branchPrefix: e.target.value })}
            />
          }
        />
        <SettingRow
          label={t("c.set.forge.draft")}
          control={
            <Switch
              label={t("c.set.forge.draftShort")}
              disabled={none}
              checked={value.prDraft}
              onChange={(v) => onChange?.({ prDraft: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.forge.codeLinks")}
          control={
            <Switch
              label={t("c.set.forge.codeLinks")}
              checked={value.codeLinks}
              onChange={(v) => onChange?.({ codeLinks: v })}
            />
          }
        />
      </Group>
      <div className="t-row">
        <span className="t-spacer" />
        <Button icon="link" onClick={onTest} disabled={none && !value.manualUrl}>
          {t("c.set.forge.test")}
        </Button>
      </div>
    </SettingsSection>
  );
}

const VERIFY: Record<PluginRow["verification"], { label: TextKey; tone: string }> = {
  ok: { label: "c.set.plugins.verify.ok", tone: "t-badge--ok" },
  mismatch: { label: "c.set.plugins.verify.mismatch", tone: "t-badge--bad" },
  missing: { label: "c.set.plugins.verify.missing", tone: "t-badge--warn" },
};

const SOURCE: Record<PluginRow["source"], TextKey> = {
  bundled: "c.set.plugins.source.bundled",
  installed: "c.set.plugins.source.installed",
  development: "c.set.plugins.source.dev",
};

const GRANT_GROUP: Record<GrantItem["group"], TextKey> = {
  Tools: "c.set.grant.group.tools",
  Environment: "c.set.grant.group.env",
  "Agent tools": "c.set.grant.group.agentTools",
};

const GRANT_RISK: Record<NonNullable<GrantItem["risk"]>, TextKey> = {
  writes: "c.set.grant.risk.writes",
  reads: "c.set.grant.risk.reads",
  network: "c.set.grant.risk.net",
};

const GRANT_STATE: Record<GrantItem["state"], TextKey> = {
  ["granted"]: "c.set.grant.state.granted",
  open: "c.promises.state.open",
  denied: "c.set.grant.state.denied",
};

export function PluginsSection({
  plugins,
  onOpen,
  onToggle,
  onCopy,
}: {
  plugins: PluginRow[];
  onOpen?: (id: string) => void;
  onToggle?: (id: string, on: boolean) => void;
  onCopy?: (t: string) => void;
}) {
  const { t } = useText();
  return (
    <SettingsSection
      title="Plugins"
      sub={t("c.set.plugins.sub", {
        count: plugins.length,
        on: plugins.filter((p) => p.enabled).length,
      })}
    >
      <ul className="t-c-plain t-stack" style={{ gap: 8 }} aria-label="Plugins">
        {plugins.map((pl) => (
          <li key={pl.id} className="t-surface t-c-plugin">
            <span className="t-c-tile__icon">
              <Icon name="plug" size={16} />
            </span>
            <div className="t-stack" style={{ gap: 4, minWidth: 0, flex: 1 }}>
              <div className="t-row t-row--wrap">
                <button type="button" className="t-c-linkish t-h3" onClick={() => onOpen?.(pl.id)}>
                  {pl.name}
                </button>
                <span className="t-meta">
                  {pl.id} · {pl.version}
                </span>
              </div>
              <span className="t-c-small t-muted">{pl.desc}</span>
              <div className="t-row t-row--wrap" style={{ gap: 6 }}>
                <span className="t-badge t-badge--plain">{t(SOURCE[pl.source])}</span>
                <span className={`t-badge ${VERIFY[pl.verification].tone}`}>
                  {t(VERIFY[pl.verification].label)}
                </span>
                {pl.open ? (
                  <span className="t-badge t-badge--warn">
                    {t("c.set.plugins.openGrants", { count: pl.open })}
                  </span>
                ) : null}
              </div>
            </div>
            <Switch
              label={t("c.set.plugins.enable", { name: pl.name })}
              checked={pl.enabled}
              onChange={(v) => onToggle?.(pl.id, v)}
            />
          </li>
        ))}
      </ul>
      <Group title={t("c.set.plugins.install")}>
        <div className="t-stack" style={{ gap: 8, padding: "4px 16px 12px" }}>
          <Command text="facet plugin add github:facet-framework/<plugin>@<tag>" onCopy={onCopy} />
          <span className="t-c-small t-muted">{t("c.set.plugins.installHint")}</span>
        </div>
      </Group>
    </SettingsSection>
  );
}

export type PluginManifest = {
  entry: string;
  sidecars: { name: string; sha256: string }[];
  installedAt: string;
  path: string;
};

function GrantTable({
  items,
  decide,
  onDecide,
}: {
  items: GrantItem[];
  decide?: Record<string, "grant" | "deny" | undefined>;
  onDecide?: (key: string, d: "grant" | "deny") => void;
}) {
  const { t } = useText();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <div className="t-stack" style={{ gap: 12 }}>
      {groups.map((g) => (
        <Group key={g} title={t(GRANT_GROUP[g])}>
          <ul className="t-c-plain">
            {items
              .filter((i) => i.group === g)
              .map((i) => (
                <li key={i.key} className="t-c-grant" data-testid={`grant-${i.key}`}>
                  <div className="t-stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="t-row t-row--wrap">
                      <span className="t-mono">{i.name}</span>
                      {i.risk ? (
                        <span
                          className={`t-badge ${i.risk === "reads" ? "t-badge--plain" : "t-badge--warn"}`}
                        >
                          {t(GRANT_RISK[i.risk])}
                        </span>
                      ) : null}
                    </span>
                    <span className="t-c-small t-muted">{i.why}</span>
                    <span className="t-meta">{t("c.set.grant.via", { via: i.via })}</span>
                  </div>
                  {onDecide ? (
                    <Segment
                      label={t("c.set.grant.decide", { name: i.name })}
                      value={decide?.[i.key] ?? ("" as "grant")}
                      options={[
                        { value: "grant", label: t("c.set.grant.grant"), icon: "check" },
                        { value: "deny", label: t("c.set.grant.deny"), icon: "close" },
                      ]}
                      onChange={(v) => onDecide(i.key, v)}
                    />
                  ) : (
                    <span
                      className={`t-badge ${i.state === "granted" ? "t-badge--ok" : i.state === "open" ? "t-badge--warn" : "t-badge--bad"}`}
                    >
                      {t(GRANT_STATE[i.state])}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </Group>
      ))}
    </div>
  );
}

export function PluginDetailSection({
  plugin,
  manifest,
  grants,
  onBack,
  onCopy,
  onOpenGrant,
}: {
  plugin: PluginRow;
  manifest: PluginManifest;
  grants: GrantItem[];
  onBack?: () => void;
  onCopy?: (t: string) => void;
  onOpenGrant?: () => void;
}) {
  const { t } = useText();
  const open = grants.filter((g) => g.state === "open").length;
  return (
    <SettingsSection
      title={plugin.name}
      sub={`${plugin.id} · ${plugin.version} · ${t(SOURCE[plugin.source])}`}
      actions={
        <Button size="small" variant="quiet" icon="back" onClick={onBack}>
          {t("c.set.plugins.all")}
        </Button>
      }
    >
      <p className="t-c-small t-ink2">{plugin.desc}</p>
      <Group title={t("c.set.plugins.package")}>
        <KeyValues
          items={[
            [
              t("c.set.plugins.entry"),
              <span className="t-mono" key="e">
                {manifest.entry}
              </span>,
            ],
            [
              t("c.set.plugins.location"),
              <span className="t-mono" key="p">
                {manifest.path}
              </span>,
            ],
            [t("c.set.plugins.installedAt"), manifest.installedAt],
            [
              t("c.set.plugins.check"),
              <span key="v" className={`t-badge ${VERIFY[plugin.verification].tone}`}>
                {t(VERIFY[plugin.verification].label)}
              </span>,
            ],
            ...manifest.sidecars.map((s): [ReactNode, ReactNode] => [
              `Sidecar ${s.name}`,
              <span className="t-mono t-c-small" key={s.name} title={s.sha256}>
                sha256:{s.sha256.slice(0, 16)}…
              </span>,
            ]),
          ]}
        />
      </Group>
      <div className="t-row t-row--wrap">
        <span className="t-h3">{t("c.set.plugins.requested")}</span>
        <span className="t-meta">
          {t("c.set.plugins.grantedOpen", { granted: grants.length - open, open })}
        </span>
      </div>
      <GrantTable items={grants} />
      {open ? (
        <div className="t-c-banner t-c-banner--warn" role="status" data-testid="plugin-open-grants">
          <Icon name="lock" size={18} />
          <div className="t-stack" style={{ gap: 6, flex: 1 }}>
            <span className="t-h3">{t("c.set.plugins.openGrants", { count: open })}</span>
            <span className="t-c-small">{t("c.set.plugins.grantHint")}</span>
            <Command text={`facet plugin grant ${plugin.id}`} onCopy={onCopy} />
            <span>
              <Button size="small" icon="external" onClick={onOpenGrant}>
                {t("c.set.plugins.openGrantPage")}
              </Button>
            </span>
          </div>
        </div>
      ) : null}
      <Group title={t("c.set.plugins.remove")}>
        <div style={{ padding: "4px 16px 12px" }}>
          <Command text={`facet plugin remove ${plugin.id}`} onCopy={onCopy} />
        </div>
      </Group>
    </SettingsSection>
  );
}

export function PluginGrantSection({
  plugin,
  items,
  decisions,
  token,
  onDecide,
  onConfirm,
  onCancel,
}: {
  plugin: PluginRow;
  items: GrantItem[];
  decisions: Record<string, "grant" | "deny" | undefined>;
  token: { valid: boolean; until: string; origin: string };
  onDecide?: (key: string, d: "grant" | "deny") => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useText();
  const decided = items.filter((i) => decisions[i.key]).length;
  const granted = items.filter((i) => decisions[i.key] === "grant").length;
  return (
    <SettingsSection
      title={t("c.set.grant.title", { name: plugin.name })}
      sub={t("c.set.grant.sub", { id: plugin.id, version: plugin.version, count: items.length })}
    >
      <div
        className={token.valid ? "t-c-banner t-c-banner--ok" : "t-c-banner t-c-banner--warn"}
        role="status"
        data-testid="grant-token"
      >
        <Icon name={token.valid ? "lock" : "warning"} size={18} />
        <div className="t-stack" style={{ gap: 2, flex: 1 }}>
          <span className="t-h3">
            {token.valid ? t("c.set.grant.openedViaLink") : t("c.set.grant.openLink")}
          </span>
          <span className="t-meta">
            {token.origin} ·{" "}
            {token.valid
              ? t("c.set.grant.validUntil", { until: token.until })
              : t("c.set.grant.noToken")}
          </span>
        </div>
      </div>
      {token.valid ? (
        <>
          <GrantTable items={items} decide={decisions} onDecide={onDecide} />
          <div className="t-c-grantfoot t-raised">
            <span className="t-c-small">
              {t("c.set.grant.progress", { decided, total: items.length, granted })}
            </span>
            <span className="t-spacer" />
            <Button variant="quiet" onClick={onCancel}>
              {t("c.cancel")}
            </Button>
            <Button
              variant="primary"
              icon="check"
              disabled={decided < items.length}
              onClick={onConfirm}
            >
              {t("c.set.grant.save")}
            </Button>
          </div>
        </>
      ) : (
        <GrantTable items={items} />
      )}
    </SettingsSection>
  );
}

export type GenUiSettings = {
  enabled: boolean;
  scope: "blocks" | "free";
  surfaces: { key: string; label: string; desc: string; on: boolean }[];
  maxBlocks: string;
  error?: string;
};

export function GenUiSection({
  value,
  onChange,
}: {
  value: GenUiSettings;
  onChange?: (patch: Partial<GenUiSettings>) => void;
}) {
  const { t } = useText();
  return (
    <SettingsSection title="Generative UI" sub={t("c.set.genui.sub")}>
      <Group>
        <SettingRow
          label={t("c.set.nav.genuiSub")}
          control={
            <Switch
              label={t("c.set.nav.genuiSub")}
              checked={value.enabled}
              onChange={(v) => onChange?.({ enabled: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.genui.scope")}
          desc={t("c.set.genui.scopeDesc")}
          control={
            <Segment
              label={t("c.set.genui.scope")}
              value={value.scope}
              options={[
                { value: "blocks", label: t("c.set.genui.blocksOnly") },
                { value: "free", label: t("c.set.genui.free") },
              ]}
              onChange={(v) => onChange?.({ scope: v })}
            />
          }
        />
        <SettingRow
          label={t("c.set.genui.maxBlocks")}
          control={
            <Field label={t("c.set.genui.count")} error={value.error}>
              {(id) => (
                <input
                  id={id}
                  className="t-input t-c-num-input"
                  inputMode="numeric"
                  value={value.maxBlocks}
                  disabled={!value.enabled}
                  aria-invalid={!!value.error || undefined}
                  onChange={(e) => onChange?.({ maxBlocks: e.target.value })}
                />
              )}
            </Field>
          }
        />
      </Group>
      <Group title={t("c.set.genui.where")}>
        {value.surfaces.map((s) => (
          <SettingRow
            key={s.key}
            label={s.label}
            desc={s.desc}
            control={
              <Switch
                label={s.label}
                disabled={!value.enabled}
                checked={value.enabled && s.on}
                onChange={(v) =>
                  onChange?.({
                    surfaces: value.surfaces.map((x) => (x.key === s.key ? { ...x, on: v } : x)),
                  })
                }
              />
            }
          />
        ))}
      </Group>
    </SettingsSection>
  );
}
