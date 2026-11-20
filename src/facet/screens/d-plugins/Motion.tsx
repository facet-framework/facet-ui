import type { CSSProperties } from "react";
import { Icon } from "../../primitives/Icon";
import { Badge, Button } from "../../primitives/controls";
import { Meter } from "../../primitives/display";
import { useText } from "../../i18n/TextProvider";
import { noop, useLifecycleLabel } from "./shared";

export type MotionRow = {
  id: string;
  summary: string;
  lifecycle: string;
  proven: number;
  scenarios: number;
  anchors: number;
};

const ROW_H = 64;

export function FlightDemo({
  rows,
  opened,
  reduced,
  onOpen = noop,
  onClose = noop,
}: {
  rows: MotionRow[];
  opened: number | null;
  reduced?: boolean;
  onOpen?: (i: number) => void;
  onClose?: () => void;
}) {
  const row = opened == null ? null : rows[opened];
  const top = opened == null ? 0 : 52 + opened * ROW_H;
  const { t } = useText();
  const lifecycleLabel = useLifecycleLabel();
  return (
    <div className="t-d-motion" data-motion={reduced ? "reduced" : "full"}>
      <div
        className="t-d-motion__stage"
        style={{ "--t-d-from-top": `${top}px`, "--t-d-from-h": `${ROW_H}px` } as CSSProperties}
      >
        <div className="t-d-motion__list t-depth" data-depth={row ? "2" : "0"}>
          <div className="t-d-motion__listhead">
            <span className="t-label">Records · navigation/atlas</span>
            <span className="t-meta">{rows.length}</span>
          </div>
          {rows.map((r, i) => (
            <button
              key={r.id}
              type="button"
              className="t-d-motion__row"
              aria-pressed={opened === i}
              onClick={() => onOpen(i)}
            >
              <span className="t-d-lc" data-lc={r.lifecycle} aria-hidden="true" />
              <span className="t-stack" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                <span className="t-mono t-wrap">{r.id.split("/").pop()}</span>
                <span className="t-meta t-ellipsis">
                  {r.id.split("/").slice(0, 2).join(" › ")}
                  <span className="t-d-motion__summary"> — {r.summary}</span>
                </span>
              </span>
              <span
                className="t-d-motion__proof t-mono"
                data-full={r.proven === r.scenarios || undefined}
              >
                {r.proven}/{r.scenarios}
              </span>
            </button>
          ))}
        </div>
        {row ? (
          <article className="t-d-flight" aria-label={t("d.motion.record", { id: row.id })}>
            <header className="t-row t-row--between">
              <Button size="small" variant="quiet" icon="back" onClick={onClose}>
                {t("d.motion.back")}
              </Button>
              <Badge tone="ok">{lifecycleLabel(row.lifecycle)}</Badge>
            </header>
            <span className="t-meta t-mono">{row.id.split("/").slice(0, 2).join(" › ")}</span>
            <h2 className="t-d-flight__title t-mono">{row.id.split("/").pop()}</h2>
            <p className="t-ink2">{row.summary}</p>
            <div className="t-d-flight__stats t-stagger">
              <CountUp value={row.scenarios} label={t("d.motion.promises")} />
              <CountUp value={row.proven} label={t("d.motion.proven")} tone="ok" />
              <CountUp value={row.anchors} label={t("d.motion.anchors")} />
            </div>
            <Meter
              value={row.scenarios ? row.proven / row.scenarios : null}
              label={t("d.motion.share")}
              tone="ok"
            />
          </article>
        ) : null}
      </div>
    </div>
  );
}

export function StaggerDemo({
  rows,
  run,
  reduced,
}: {
  rows: MotionRow[];
  run: number;
  reduced?: boolean;
}) {
  const { t } = useText();
  return (
    <div className="t-d-motion" data-motion={reduced ? "reduced" : "full"}>
      <ul key={run} className="t-d-motion__stagger t-stagger" aria-label={t("d.motion.staggered")}>
        {rows.map((r, i) => (
          <li key={r.id} className="t-d-motion__srow">
            <span className="t-d-lc" data-lc={r.lifecycle} aria-hidden="true" />
            <span className="t-mono t-wrap">{r.id}</span>
            <span className="t-spacer" />
            <span className="t-meta">{i < 8 ? `${i * 24} ms` : "168 ms"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CountUp({
  value,
  label,
  tone,
  suffix,
}: {
  value: number;
  label: string;
  tone?: "ok" | "warn";
  suffix?: string;
}) {
  return (
    <div className="t-d-count" aria-label={`${label}: ${value}${suffix ?? ""}`}>
      <span
        className={tone ? `t-d-count__n t-${tone}` : "t-d-count__n"}
        style={{ "--t-d-n": value } as CSSProperties}
        aria-hidden="true"
        data-suffix={suffix ?? ""}
      />
      <span className="t-d-count__fallback">{value}</span>
      <span className="t-stat__label">{label}</span>
    </div>
  );
}

export function CountUpBoard({
  figures,
  run,
}: {
  figures: { value: number; label: string; tone?: "ok" | "warn"; suffix?: string }[];
  run: number;
}) {
  return (
    <div key={run} className="t-d-countboard t-stagger">
      {figures.map((f) => (
        <div key={f.label} className="t-d-countboard__tile">
          <CountUp {...f} />
        </div>
      ))}
    </div>
  );
}

export function ReducedMotionDemo({
  rows,
  opened,
  onOpen,
  onClose,
}: {
  rows: MotionRow[];
  opened: number | null;
  onOpen?: (i: number) => void;
  onClose?: () => void;
}) {
  return (
    <div className="t-d-motion__pair">
      <div className="t-stack" style={{ gap: 8 }}>
        <span className="t-label t-row" style={{ gap: 6 }}>
          <Icon name="eye" size={12} /> prefers-reduced-motion: reduce
        </span>
        <FlightDemo rows={rows} opened={opened} reduced onOpen={onOpen} onClose={onClose} />
      </div>
      <StaggerDemo rows={rows.slice(0, 6)} run={0} reduced />
    </div>
  );
}
