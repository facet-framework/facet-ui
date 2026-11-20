import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/facet/screens/c-contents/frame";

import { createContext, useContext, type ReactNode } from "react";
import { Breadcrumbs } from "../../primitives/overlay";
import { Segment } from "../../primitives/controls";
import { Finding } from "../../primitives/display";
import { Icon } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import type { ContentGroup, Tone, ViewDef } from "./model";

export const ContentsCrumbContext = createContext<((key: string) => void) | undefined>(undefined);

export const short = (id: string) => id.split("/").pop() ?? id;
export const capOf = (id: string) => id.split("/").slice(0, 2).join("/");

export function splitGwt(text: string): { given: string; when: string; then: string } {
  const out = { given: "", when: "", then: "" };
  let cur: keyof typeof out = "given";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const m = localized.text1.exec(line);
    if (m) {
      const k = m[1].toLowerCase();
      if (k === "given" || k === "accepted") cur = "given";
      else if (k === localized.text2 || k === "when") cur = "when";
      else if (k === "then" || k === labelText.text198) cur = "then";
      out[cur] +=
        (out[cur] ? " " : "") +
        (k === localized.text3
          ? `${localized.text4}${m[2]}`
          : k === "and" || k === "but"
            ? `${k} ${m[2]}`
            : m[2]);
    } else if (line) {
      out[cur] += (out[cur] ? " " : "") + line;
    }
  }
  return out;
}

export function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <span>
      {parts.map((part, i) =>
        part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="t-c-icode">
            {part.slice(1, -1)}
          </code>
        ) : (
          part.replace(/\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g, "$1$2")
        ),
      )}
    </span>
  );
}

export const stripMd = (text: string) =>
  text.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g, "$1$2");

export function Gwt({ text, compact }: { text: string; compact?: boolean }) {
  const { t } = useText();
  const g = splitGwt(text);
  return (
    <dl className={compact ? "t-c-gwt t-c-gwt--compact" : "t-c-gwt"}>
      <dt>{t("c.gwt.given")}</dt>
      <dd>{g.given ? <InlineMd text={g.given} /> : "—"}</dd>
      <dt>{t("c.gwt.when")}</dt>
      <dd>{g.when ? <InlineMd text={g.when} /> : "—"}</dd>
      <dt>{t("c.gwt.then")}</dt>
      <dd className="t-c-gwt__then">{g.then ? <InlineMd text={g.then} /> : "—"}</dd>
    </dl>
  );
}

export type KindFrameProps<V extends string> = {
  kindLabel: string;
  group: string;
  figure?: ReactNode;

  mark?: ReactNode;
  of?: ReactNode;
  tone?: Exclude<Tone, "signal" | "neutral">;
  sentence: ReactNode;
  lead?: ReactNode;
  views?: ViewDef<V>[];
  view?: V;
  onView?: (v: V) => void;

  groupId?: ContentGroup;

  onCrumb?: (key: string) => void;
  toolbar?: ReactNode;
  aside?: ReactNode;
  stats?: ReactNode;
  children: ReactNode;
  testId?: string;
};

export function KindFrame<V extends string>({
  kindLabel,
  group,
  figure,
  mark,
  of,
  tone,
  sentence,
  lead,
  views,
  view,
  onView,
  groupId,
  onCrumb,
  toolbar,
  aside,
  stats,
  children,
  testId,
}: KindFrameProps<V>) {
  const { t } = useText();

  const fromContainer = useContext(ContentsCrumbContext);
  const crumb = onCrumb ?? fromContainer;
  return (
    <div className="t-page t-c-kind" data-testid={testId}>
      <Breadcrumbs
        crumbs={[
          { key: "contents", label: t("c.frame.contents"), onClick: () => crumb?.("contents") },
          { key: "group", label: group, onClick: () => crumb?.(groupId ?? group) },
          { key: "kind", label: kindLabel },
        ]}
      />
      <div className={stats ? "t-c-kind__head t-c-kind__head--stats" : "t-c-kind__head"}>
        <Finding
          eyebrow={`${group} · ${kindLabel}`}
          figure={figure}
          mark={mark}
          of={of}
          tone={tone}
          sentence={sentence}
          lead={lead}
        />
        {stats ? <div className="t-c-kind__stats t-stagger">{stats}</div> : null}
      </div>
      {views && view ? (
        <div className="t-c-kind__bar">
          <Segment
            label={t("c.frame.view")}
            value={view}
            options={views.map((v) => ({ value: v.value, label: v.label, icon: v.icon }))}
            onChange={onView}
          />
          {toolbar ? <div className="t-c-kind__tools">{toolbar}</div> : null}
        </div>
      ) : toolbar ? (
        <div className="t-c-kind__bar">{toolbar}</div>
      ) : null}
      <div className={aside ? "t-c-kind__body t-c-kind__body--aside" : "t-c-kind__body"}>
        <div className="t-c-kind__main t-anim-rise">{children}</div>
        {aside ? <aside className="t-c-kind__aside">{aside}</aside> : null}
      </div>
    </div>
  );
}

export function KeyValues({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="t-c-kv">
      {items.map(([k, v], i) => (
        <div key={i} className="t-c-kv__row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MiniStat({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: number | string | null;
  tone?: Tone;
}) {
  const { t, number } = useText();
  return (
    <div className="t-c-ministat">
      <span
        className={
          tone && tone !== "neutral" && tone !== "signal"
            ? `t-c-ministat__v t-${tone}`
            : "t-c-ministat__v"
        }
      >
        {value == null ? (
          <span title={t("c.notMeasured")} className="t-muted">
            —
          </span>
        ) : typeof value === "number" ? (
          number(value)
        ) : (
          value
        )}
      </span>
      <span className="t-c-ministat__l">{label}</span>
    </div>
  );
}

export function RecordRef({ id, onOpen }: { id: string; onOpen?: (id: string) => void }) {
  const parts = id.split("/");
  const slug = parts.pop();
  return (
    <button type="button" className="t-c-ref" onClick={() => onOpen?.(id)} title={id}>
      <span className="t-muted">{parts.join("/")}/</span>
      <span>{slug}</span>
    </button>
  );
}

export function PathRef({ path, line }: { path: string; line?: number }) {
  const parts = path.split("/");
  const file = parts.pop();
  return (
    <span className="t-c-path t-mono" title={line ? `${path}:${line}` : path}>
      <Icon name="file" size={12} />
      <span className="t-muted t-wrap">{parts.length ? `${parts.join("/")}/` : ""}</span>
      <span>{file}</span>
      {line ? <span className="t-muted">:{line}</span> : null}
    </span>
  );
}
