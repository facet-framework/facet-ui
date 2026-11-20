import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { TextKey } from "../../i18n/en";
import { useText } from "../../i18n/TextProvider";
import { Icon } from "../../primitives/Icon";
import { Badge, Button, IconButton, Segment } from "../../primitives/controls";
import { ListRow, Meter, Skeleton } from "../../primitives/display";
import { DataTable, Pagination, type Column, type SortDir } from "../../primitives/collection";
import { Sheet } from "../../primitives/overlay";
import { Mosaic, Ring, pct, pctText, shareFill } from "./charts";
import {
  ZOOM_IN_MAX,
  ZOOM_OUT_MAX,
  iso,
  layoutCity,
  panView,
  quad,
  squarify,
  turnCity,
  wrapLabel,
  zoomView,
  type Building,
  type CityLayout,
  type ViewBox,
} from "./city";
import type { DomainView, FeatureView } from "./model";
import { LIFECYCLE } from "./parts";

export type ProductView = "city" | "treemap" | "list";

export type ProductPageProps = {
  domains: DomainView[];
  features: FeatureView[];
  view: ProductView;
  state?: "ready" | "loading";
  selected?: string | null;

  time?: { dates: string[]; index: number };
  mobile?: boolean;

  page?: number;
  pageSize?: number;
  sort?: { key: string; dir: SortDir };
  onView?: (v: ProductView) => void;
  onSelect?: (id: string | null) => void;
  onOpenRecord?: (id: string) => void;
  onOpenDomain?: (id: string) => void;
  onOpenCapability?: (domain: string, capability: string) => void;
  onTime?: (index: number) => void;
  onPage?: (page: number) => void;
  onSort?: (key: string) => void;
};

const VIEWS: { value: ProductView; label: TextKey | null; icon: "map" | "grid" | "table" }[] = [
  { value: "city", label: "a.product.view.city", icon: "map" },
  { value: "treemap", label: null, icon: "grid" },
  { value: "list", label: "a.product.view.list", icon: "table" },
];

export function visibleAt(features: FeatureView[], time?: { dates: string[]; index: number }) {
  if (!time || time.index >= time.dates.length - 1) return features;
  const at = time.dates[time.index];
  return features.filter((f) => f.createdAt != null && f.createdAt <= at);
}

export function ProductPage(props: ProductPageProps) {
  const {
    domains,
    view,
    state = "ready",
    time,
    mobile,
    selected,
    onView,
    onTime,
    onSelect,
  } = props;
  const { t, plural } = useText();
  const known = props.features.filter((f) => domains.some((d) => d.id === f.domain));
  const features = visibleAt(known, time);
  const sel = selected ? (features.find((f) => f.id === selected) ?? null) : null;
  const loading = state === "loading";
  const early = !!time && time.index < time.dates.length - 1;
  const range = useRef<HTMLInputElement>(null);

  const headline = (all: FeatureView[]) => {
    const featureCount = all.filter((f) => f.type === "feature").length;
    const assumptionCount = all.length - featureCount;
    const scen = all.reduce((a, f) => a + f.scenarios, 0);
    const proven = all.reduce((a, f) => a + f.proven, 0);
    return {
      title: `${plural("a.product.features", featureCount)}${
        assumptionCount ? ` ${plural("a.product.plusAssumptions", assumptionCount)}` : ""
      }`,
      lead: `${t("a.product.lead", {
        domains: domains.length,
        share: pctText(pct(proven, scen), t),
        scenarios: scen,
      })}${view === "list" ? ` ${t("a.product.lead.list")}` : ""}`,
    };
  };
  const shown = headline(visibleAt(props.features, time));

  const today = early ? headline(props.features) : null;

  return (
    <div className="t-page t-a-product" data-testid="product" data-view={view}>
      <header className="t-a-product__head">
        <div className="t-stack" style={{ gap: 6 }}>
          <span className="t-eyebrow">
            {early
              ? t("a.product.asOf", { date: time!.dates[time!.index] })
              : t("a.common.product")}
          </span>
          <h1 className="t-h1 t-steady">
            {loading ? "— Records" : <Steady shown={shown.title} reserve={today?.title} />}
          </h1>
          <p className="t-lead t-steady">
            {loading ? t("a.product.reading") : <Steady shown={shown.lead} reserve={today?.lead} />}
          </p>
        </div>
        <div className="t-a-product__tools">
          <Segment
            label={t("a.cap.viewLabel")}
            value={view}
            options={VIEWS.map((v) => ({ ...v, label: v.label ? t(v.label) : "Treemap" }))}
            onChange={onView}
          />
        </div>
      </header>

      <div className="t-a-product__body" data-selected={sel ? "true" : undefined}>
        <div className="t-a-product__canvas">
          {loading ? (
            <CitySkeleton />
          ) : view === "city" ? (
            <City
              domains={domains}
              features={features}
              selected={sel?.id ?? null}
              onSelect={onSelect}
              onOpenDomain={props.onOpenDomain}
            />
          ) : view === "treemap" ? (
            <Treemap
              domains={domains}
              features={features}
              selected={sel?.id ?? null}
              onSelect={onSelect}
            />
          ) : (
            <FeatureTable {...props} features={features} />
          )}
          {!loading && view !== "list" ? <Legend view={view} /> : null}
        </div>
        {sel && !mobile ? (
          <aside
            className="t-raised t-a-product__aside t-anim-rise"
            aria-label={t("a.product.selection")}
          >
            <Selection f={sel} {...props} />
          </aside>
        ) : null}
      </div>

      {time ? (
        <div className="t-a-time t-surface" data-testid="time">
          <Icon name="clock" size={16} />
          <label className="t-a-time__label" htmlFor="t-a-time-range">
            {t("a.product.time")}
          </label>
          <input
            ref={range}
            id="t-a-time-range"
            className="t-a-time__range"
            type="range"
            min={0}
            max={time.dates.length - 1}
            value={time.index}
            aria-valuetext={time.dates[time.index]}
            onChange={(e) => onTime?.(Number(e.target.value))}
          />
          <span className="t-mono t-a-time__date">{time.dates[time.index]}</span>
          <span className="t-meta t-hide-mobile t-steady">
            <Steady
              shown={t("a.product.ofRecords", { shown: features.length, total: known.length })}
              reserve={t("a.product.ofRecords", { shown: known.length, total: known.length })}
            />
          </span>
          {}
          <Button
            size="small"
            variant="quiet"
            icon="forward"
            className="t-a-time__today"
            data-idle={early ? undefined : "true"}
            aria-hidden={early ? undefined : true}
            tabIndex={early ? undefined : -1}
            onClick={() => {
              onTime?.(time.dates.length - 1);

              range.current?.focus();
            }}
          >
            {t("a.product.today")}
          </Button>
        </div>
      ) : null}

      {!loading ? (
        <DistrictStrip domains={domains} features={features} onOpenDomain={props.onOpenDomain} />
      ) : null}

      {mobile ? (
        <Sheet
          open={!!sel}
          side="bottom"
          title={sel?.slug ?? ""}
          meta={sel?.id}
          onClose={() => onSelect?.(null)}
        >
          {sel ? <Selection f={sel} {...props} bare /> : null}
        </Sheet>
      ) : null}
    </div>
  );
}

function Steady({ shown, reserve }: { shown: string; reserve?: string | null }) {
  return (
    <>
      <span>{shown}</span>
      {reserve != null && reserve !== shown ? (
        <span className="t-steady__reserve" aria-hidden="true">
          {reserve}
        </span>
      ) : null}
    </>
  );
}

const UNIT = 16;

function onKey(e: KeyboardEvent, run: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    run();
  }
}

function viewOf(city: CityLayout): ViewBox {
  const { minX, minY, maxX, maxY } = city.bounds;
  const pad = 2.2;
  return {
    x: (minX - pad) * UNIT,
    y: (minY - pad) * UNIT,
    w: (maxX - minX + pad * 2) * UNIT,
    h: (maxY - minY + pad * 2) * UNIT,
  };
}

const DRAG_SLOP = 4;
const KEY_PAN = 0.08;
const BUTTON_ZOOM = 1.4;

function City({
  domains,
  features,
  selected,
  onSelect,
  onOpenDomain,
}: {
  domains: DomainView[];
  features: FeatureView[];
  selected: string | null;
  onSelect?: (id: string | null) => void;
  onOpenDomain?: (id: string) => void;
}) {
  const { t } = useText();
  const [quarter, setQuarter] = useState(0);
  const laid = useMemo(() => layoutCity(domains, features), [domains, features]);
  const city = useMemo(() => turnCity(laid, quarter), [laid, quarter]);
  const base = useMemo(() => viewOf(city), [city]);
  const svg = useRef<SVGSVGElement>(null);
  const baseRef = useRef(base);
  useEffect(() => {
    baseRef.current = base;
  }, [base]);

  const [held, setHeld] = useState({ key: base, view: base });
  const view = held.key === base ? held.view : base;
  const update = useCallback(
    (next: (v: ViewBox, b: ViewBox) => ViewBox) =>
      setHeld((s) => {
        const b = baseRef.current;
        return { key: b, view: next(s.key === b ? s.view : b, b) };
      }),
    [],
  );

  const toDrawing = useCallback((clientX: number, clientY: number): [number, number] => {
    const el = svg.current;
    const m = el?.getScreenCTM?.();
    if (!el || !m) return [0, 0];
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }, []);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const at = toDrawing(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * 0.0015);
      update((v, b) => zoomView(v, factor, at, b));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [toDrawing, update]);

  const pointers = useRef(new Map<number, [number, number]>());
  const drag = useRef({ moved: false, start: [0, 0] as [number, number] });
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 1) drag.current = { moved: false, start: [e.clientX, e.clientY] };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const now: [number, number] = [e.clientX, e.clientY];
    if (pointers.current.size === 1) {
      const [sx, sy] = drag.current.start;
      if (!drag.current.moved && Math.hypot(now[0] - sx, now[1] - sy) < DRAG_SLOP) return;
      if (!drag.current.moved) {
        drag.current.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
      const a = toDrawing(last[0], last[1]);
      const b = toDrawing(now[0], now[1]);
      update((v, w) => panView(v, a[0] - b[0], a[1] - b[1], w));
    } else if (pointers.current.size === 2) {
      drag.current.moved = true;
      const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(last[0] - other[0], last[1] - other[1]);
      const after = Math.hypot(now[0] - other[0], now[1] - other[1]);
      if (before > 0 && after > 0) {
        const at = toDrawing((now[0] + other[0]) / 2, (now[1] + other[1]) / 2);
        update((v, b) => zoomView(v, after / before, at, b));
      }
    }
    pointers.current.set(e.pointerId, now);
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
  };

  const zoomBy = (factor: number) =>
    update((v, b) => zoomView(v, factor, [v.x + v.w / 2, v.y + v.h / 2], b));
  const panBy = (fx: number, fy: number) => update((v, b) => panView(v, v.w * fx, v.h * fy, b));
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_PAN, 0],
      ArrowRight: [KEY_PAN, 0],
      ArrowUp: [0, -KEY_PAN],
      ArrowDown: [0, KEY_PAN],
    };
    if (moves[e.key]) panBy(...moves[e.key]);
    else if (e.key === "+" || e.key === "=") zoomBy(BUTTON_ZOOM);
    else if (e.key === "-" || e.key === "_") zoomBy(1 / BUTTON_ZOOM);
    else if (e.key === "0") update((_, b) => b);
    else return;
    e.preventDefault();
  };

  const zoom = base.w / view.w;
  return (
    <div className="t-a-citymap">
      <svg
        ref={svg}
        className="t-a-city"
        viewBox={[view.x, view.y, view.w, view.h].map((v) => v.toFixed(1)).join(" ")}
        role="group"
        tabIndex={0}
        aria-label={t("a.product.cityLabel", { count: features.length })}
        aria-describedby="t-a-city-keys"
        data-testid="city"
        data-zoom={zoom.toFixed(2)}
        data-turn={quarter}
        data-dim={selected ? "true" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={(e) => {
          const at = toDrawing(e.clientX, e.clientY);
          update((v, b) => zoomView(v, 2, at, b));
        }}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect?.(null);
        }}
      >
        {city.districts.map((d) => (
          <g key={d.key} className="t-a-city__district">
            <polygon
              points={quad(
                [
                  [d.x, d.y, 0],
                  [d.x + d.w, d.y, 0],
                  [d.x + d.w, d.y + d.d, 0],
                  [d.x, d.y + d.d, 0],
                ],
                UNIT,
              )}
            />
          </g>
        ))}
        {city.blocks.map((b) => {
          const [lx, ly] = iso(b.x + 0.3, b.y + b.d);
          const tx = lx * UNIT;
          const ty = ly * UNIT + 11;
          const lines = wrapLabel(b.label, (b.w * UNIT) / 5.6);
          return (
            <g key={b.key} className="t-a-city__block">
              <polygon
                points={quad(
                  [
                    [b.x, b.y, 0],
                    [b.x + b.w, b.y, 0],
                    [b.x + b.w, b.y + b.d, 0],
                    [b.x, b.y + b.d, 0],
                  ],
                  UNIT,
                )}
              />
              <text
                x={tx}
                y={ty}
                className="t-a-city__cap"
                transform={`rotate(30 ${tx} ${ty})`}
                data-testid={`city-cap-${b.key}`}
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={tx} dy={i ? 10 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
        {city.buildings.map((b) => (
          <Tower
            key={b.feature.id}
            b={b}
            selected={selected === b.feature.id}
            onSelect={onSelect}
          />
        ))}
        {city.districts.map((d) => {
          const [lx, ly] = iso(d.x + 0.6, d.y + d.d);
          const tx = lx * UNIT;
          const ty = ly * UNIT + 20;
          return (
            <text
              key={d.key}
              x={tx}
              y={ty}
              className="t-a-city__label"
              transform={`rotate(30 ${tx} ${ty})`}
              role="link"
              tabIndex={0}
              onClick={() => onOpenDomain?.(d.domain)}
              onKeyDown={(e) => onKey(e, () => onOpenDomain?.(d.domain))}
            >
              {d.label}
            </text>
          );
        })}
      </svg>
      <div
        className="t-a-citymap__tools t-raised"
        role="toolbar"
        aria-label={t("a.product.mapTools")}
      >
        <IconButton
          icon="zoomIn"
          label={t("a.product.zoomIn")}
          size="small"
          data-testid="city-zoom-in"
          disabled={zoom >= ZOOM_IN_MAX - 0.01}
          onClick={() => zoomBy(BUTTON_ZOOM)}
        />
        <IconButton
          icon="zoomOut"
          label={t("a.product.zoomOut")}
          size="small"
          data-testid="city-zoom-out"
          disabled={zoom <= 1 / ZOOM_OUT_MAX + 0.01}
          onClick={() => zoomBy(1 / BUTTON_ZOOM)}
        />
        <IconButton
          icon="rotateLeft"
          label={t("a.product.turnLeft")}
          size="small"
          data-testid="city-turn-left"
          onClick={() => setQuarter((q) => (q + 3) % 4)}
        />
        <IconButton
          icon="rotateRight"
          label={t("a.product.turnRight")}
          size="small"
          data-testid="city-turn-right"
          onClick={() => setQuarter((q) => (q + 1) % 4)}
        />
        <IconButton
          icon="fit"
          label={t("a.product.fitCity")}
          size="small"
          data-testid="city-fit"
          onClick={() => update((_, b) => b)}
        />
      </div>
      <p id="t-a-city-keys" className="t-sr">
        {t("a.product.mapKeys")}
      </p>
    </div>
  );
}

function Tower({
  b,
  selected,
  onSelect,
}: {
  b: Building;
  selected: boolean;
  onSelect?: (id: string | null) => void;
}) {
  const { t } = useText();
  const { x, y, w, h, feature: f } = b;
  const p = pct(f.proven, f.scenarios);
  const fill = f.lifecycle === "planned" ? "var(--t-plan-wash)" : shareFill(p);
  const top = quad(
    [
      [x, y, h],
      [x + w, y, h],
      [x + w, y + w, h],
      [x, y + w, h],
    ],
    UNIT,
  );
  const left = quad(
    [
      [x, y + w, 0],
      [x + w, y + w, 0],
      [x + w, y + w, h],
      [x, y + w, h],
    ],
    UNIT,
  );
  const right = quad(
    [
      [x + w, y, 0],
      [x + w, y + w, 0],
      [x + w, y + w, h],
      [x + w, y, h],
    ],
    UNIT,
  );
  const [mx, my] = iso(x + w / 2, y + w / 2, h);
  return (
    <g
      className="t-a-tower"
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={t(f.drift ? "a.product.towerDrift" : "a.product.towerLabel", {
        id: f.id,
        scenarios: f.scenarios,
        share: pctText(p, t),
      })}
      data-planned={f.lifecycle === "planned" || undefined}
      data-selected={selected || undefined}
      data-testid={`tower-${f.id}`}
      onClick={() => onSelect?.(selected ? null : f.id)}
      onKeyDown={(e) => onKey(e, () => onSelect?.(selected ? null : f.id))}
      style={{ ["--t-a-fill" as string]: fill }}
    >
      <polygon points={right} className="t-a-tower__r" />
      <polygon points={left} className="t-a-tower__l" />
      <polygon points={top} className="t-a-tower__t" />
      {f.drift ? <circle cx={mx * UNIT} cy={my * UNIT} r="3" className="t-a-tower__drift" /> : null}
      <title>{f.id}</title>
    </g>
  );
}

function CitySkeleton() {
  const { t } = useText();
  return (
    <div className="t-a-city-skel" aria-busy="true" data-testid="city-loading">
      <svg
        viewBox="-200 -20 400 220"
        className="t-a-city"
        role="img"
        aria-label={t("a.product.cityLoading")}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const x = (i % 3) * 9;
          const y = Math.floor(i / 3) * 9;
          return (
            <polygon
              key={i}
              className="t-a-city__skel"
              style={{ animationDelay: `${i * 120}ms` }}
              points={quad(
                [
                  [x, y, 0],
                  [x + 7, y, 0],
                  [x + 7, y + 7, 0],
                  [x, y + 7, 0],
                ],
                10,
              )}
            />
          );
        })}
      </svg>
      <div className="t-row" style={{ gap: 12, justifyContent: "center" }}>
        <Skeleton width={120} height={10} />
        <Skeleton width={80} height={10} />
      </div>
    </div>
  );
}

function Legend({ view }: { view: "city" | "treemap" }) {
  const { t } = useText();
  return (
    <div className="t-a-legend t-meta" aria-label={t("a.product.legend")}>
      <span className="t-row" style={{ gap: 6 }}>
        <span className="t-a-legend__ramp" /> {t("a.product.legendRamp")}
      </span>
      <span className="t-row" style={{ gap: 6 }}>
        <span className="t-a-legend__plan" /> {t("a.lifecycle.planned")}
      </span>
      <span className="t-row" style={{ gap: 6 }}>
        <span className="t-dot t-dot--warn" /> {t("a.overview.drift")}
      </span>
      <span data-testid="product-legend-size">
        {t(view === "treemap" ? "a.product.legendArea" : "a.product.legendHeight")}
      </span>
    </div>
  );
}

function CapLabel({
  title,
  rect,
}: {
  title: string;
  rect: { x: number; y: number; w: number; h: number };
}) {
  if (rect.w <= 60) return null;
  const width = (rect.w - 10) / 6.2;
  const lines = wrapLabel(title, width);

  if (lines.length * 12 + 14 > rect.h || lines.some((l) => l.length > width)) return null;
  const x = rect.x + 6;
  const y = rect.y + rect.h - 6 - (lines.length - 1) * 12;
  return (
    <text x={x} y={y} className="t-a-treemap__cap-label">
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i ? 12 : 0}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Treemap({
  domains,
  features,
  selected,
  onSelect,
}: {
  domains: DomainView[];
  features: FeatureView[];
  selected: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const { t, number: nf } = useText();
  const W = 1200;
  const H = 620;
  const weight = (f: FeatureView) => Math.max(1, f.scenarios);
  const doms = domains
    .map((d) => ({ d, fs: features.filter((f) => f.domain === d.id) }))
    .filter((x) => x.fs.length);
  const dRects = squarify(
    doms.map((x) => x.fs.reduce((a, f) => a + weight(f), 0)),
    { x: 0, y: 0, w: W, h: H },
  );
  return (
    <svg
      className="t-a-treemap"
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label={t("a.product.treemapLabel")}
      data-testid="treemap"
      data-dim={selected ? "true" : undefined}
    >
      {doms.map(({ d, fs }, di) => {
        const r = dRects[di];
        const inner = {
          x: r.x + 3,
          y: r.y + 22,
          w: Math.max(0, r.w - 6),
          h: Math.max(0, r.h - 25),
        };
        const caps = d.capabilities
          .map((c) => ({ c, fs: fs.filter((f) => f.capability === c.id) }))
          .filter((x) => x.fs.length);
        const cRects = squarify(
          caps.map((x) => x.fs.reduce((a, f) => a + weight(f), 0)),
          inner,
        );
        return (
          <g key={d.id}>
            <rect
              x={r.x + 1}
              y={r.y + 1}
              width={Math.max(0, r.w - 2)}
              height={Math.max(0, r.h - 2)}
              rx="8"
              className="t-a-treemap__domain"
            />
            <text x={r.x + 10} y={r.y + 16} className="t-a-treemap__label">
              {d.title} · {nf(fs.length)}
            </text>
            {caps.map(({ c, fs: cfs }, ci) => {
              const cr = cRects[ci];
              const fRects = squarify(cfs.map(weight), {
                x: cr.x + 2,
                y: cr.y + 2,
                w: Math.max(0, cr.w - 4),
                h: Math.max(0, cr.h - 4),
              });
              return (
                <g key={c.id}>
                  <rect
                    x={cr.x}
                    y={cr.y}
                    width={cr.w}
                    height={cr.h}
                    rx="5"
                    className="t-a-treemap__cap"
                  />
                  {cfs.map((f, fi) => {
                    const fr = fRects[fi];
                    const p = pct(f.proven, f.scenarios);
                    return (
                      <rect
                        key={f.id}
                        x={fr.x + 0.5}
                        y={fr.y + 0.5}
                        width={Math.max(0, fr.w - 1)}
                        height={Math.max(0, fr.h - 1)}
                        rx="2"
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected === f.id}
                        aria-label={t("a.product.cellLabel", { id: f.id, share: pctText(p, t) })}
                        className="t-a-treemap__cell"
                        data-selected={selected === f.id || undefined}
                        style={{
                          fill: f.lifecycle === "planned" ? "var(--t-plan-wash)" : shareFill(p),
                        }}
                        onClick={() => onSelect?.(selected === f.id ? null : f.id)}
                        onKeyDown={(e) =>
                          onKey(e, () => onSelect?.(selected === f.id ? null : f.id))
                        }
                      >
                        <title>{f.id}</title>
                      </rect>
                    );
                  })}
                  <CapLabel title={c.title} rect={cr} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

const LIFE_RANK = { active: 0, planned: 1, deprecated: 2 } as const;

function sorted(features: FeatureView[], sort?: { key: string; dir: SortDir }) {
  if (!sort) return features;
  const val = (f: FeatureView): string | number => {
    switch (sort.key) {
      case "proven":
        return f.scenarios ? f.proven / f.scenarios : -1;
      case "scenarios":
        return f.scenarios;
      case "anchors":
        return f.anchors;
      case "drift":
        return f.drift;
      case "lifecycle":
        return LIFE_RANK[f.lifecycle];
      default:
        return f.id;
    }
  };
  return [...features].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    const r = x < y ? -1 : x > y ? 1 : 0;
    if (r !== 0) return sort.dir === "asc" ? r : -r;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function FeatureTable({
  features,
  page = 1,
  pageSize = 25,
  sort,
  mobile,
  onPage,
  onSort,
  onSelect,
  selected,
}: ProductPageProps) {
  const { t, number: nf } = useText();
  const rows = sorted(features, sort).slice((page - 1) * pageSize, page * pageSize);
  const cols: Column<FeatureView>[] = [
    {
      key: "id",
      label: "Record",
      sortable: true,
      render: (f) => (
        <span className="t-stack" style={{ gap: 2 }}>
          <span className="t-mono">{f.slug}</span>
          <span className="t-meta">
            {f.domain}/{f.capability}
          </span>
        </span>
      ),
    },
    {
      key: "scenarios",
      label: t("a.cap.col.scenarios"),
      numeric: true,
      sortable: true,
      render: (f) => nf(f.scenarios),
    },
    {
      key: "proven",
      label: t("a.cap.col.proven"),
      sortable: true,
      width: 180,
      render: (f) => (
        <span className="t-row" style={{ gap: 8 }}>
          <span style={{ width: 90 }} className="t-hide-mobile">
            <Meter
              value={f.scenarios ? f.proven / f.scenarios : null}
              thin
              tone={f.proven === f.scenarios ? "ok" : "warn"}
              label={t("a.overview.domainProven", { title: f.slug })}
            />
          </span>
          <span className="t-num">{pctText(pct(f.proven, f.scenarios), t)}</span>
        </span>
      ),
    },
    {
      key: "anchors",
      label: t("a.common.anchors"),
      numeric: true,
      sortable: true,
      hideOnMobile: true,
      render: (f) => nf(f.anchors),
    },
    {
      key: "drift",
      label: t("a.overview.drift"),
      numeric: true,
      sortable: true,
      render: (f) =>
        f.drift ? <Badge tone="warn">{f.drift}</Badge> : <span className="t-muted">—</span>,
    },
    {
      key: "lifecycle",
      label: t("a.product.col.lifecycle"),
      sortable: true,
      hideOnMobile: true,
      render: (f) => (
        <Badge
          tone={f.lifecycle === "active" ? "ok" : f.lifecycle === "planned" ? "plan" : "neutral"}
        >
          {t(LIFECYCLE[f.lifecycle])}
        </Badge>
      ),
    },
  ];
  return (
    <div className="t-stack" style={{ gap: 4 }} data-testid="product-list">
      <DataTable
        label={t("a.product.tableLabel")}
        columns={cols}
        rows={rows}
        rowKey={(f) => f.id}
        sort={sort}
        onSort={onSort}
        onRowClick={(f) => onSelect?.(selected === f.id ? null : f.id)}
        dense
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={features.length}
        compact={mobile}
        onPage={onPage}
      />
    </div>
  );
}

function Selection({
  f,
  bare,
  onOpenRecord,
  onOpenCapability,
  onSelect,
}: ProductPageProps & { f: FeatureView; bare?: boolean }) {
  const { t, plural, number: nf } = useText();
  const p = pct(f.proven, f.scenarios);
  return (
    <div className="t-stack t-a-sel" style={{ gap: 14 }} data-testid="selection">
      {!bare ? (
        <div className="t-row t-row--between">
          <span className="t-eyebrow">{t("a.product.selection")}</span>
          <Button
            size="small"
            variant="quiet"
            icon="close"
            aria-label={t("a.product.clearSelection")}
            onClick={() => onSelect?.(null)}
          />
        </div>
      ) : null}
      {!bare ? <span className="t-h3 t-mono">{f.slug}</span> : null}
      <span className="t-muted t-clamp-3">{f.summary}</span>
      <div className="t-row" style={{ gap: 14 }}>
        <Ring value={p} size={64} label={t("a.common.proven")} />
        <div className="t-stack" style={{ gap: 6 }}>
          <span>
            {t("a.product.scenariosProven", { proven: f.proven, scenarios: f.scenarios })}
          </span>
          <Mosaic
            cells={f.mosaic ?? Array.from({ length: f.scenarios }, (_, i) => i < f.proven)}
            label={t("a.product.promises")}
          />
        </div>
      </div>
      <dl className="t-a-kv">
        <dt>{t("a.product.area")}</dt>
        <dd>
          <button
            type="button"
            className="t-a-link"
            onClick={() => onOpenCapability?.(f.domain, f.capability)}
          >
            {f.domain} / {f.capability}
          </button>
        </dd>
        <dt>{t("a.common.anchors")}</dt>
        <dd>{nf(f.anchors)}</dd>
        <dt>Tests</dt>
        <dd>{nf(f.tests)}</dd>
        <dt>{t("a.overview.drift")}</dt>
        <dd className={f.drift ? "t-warn" : undefined}>
          {f.drift ? plural("a.product.files", f.drift) : t("a.overview.none")}
        </dd>
        <dt>{t("a.product.knowledgeOpen")}</dt>
        <dd>{t("a.product.ofFive", { count: f.knowledgeOpen })}</dd>
        <dt>{t("a.product.created")}</dt>
        <dd>{f.createdAt ?? "—"}</dd>
      </dl>
      <Button variant="primary" iconAfter="forward" onClick={() => onOpenRecord?.(f.id)}>
        {t("a.product.openRecord")}
      </Button>
    </div>
  );
}

function DistrictStrip({
  domains,
  features,
  onOpenDomain,
}: {
  domains: DomainView[];
  features: FeatureView[];
  onOpenDomain?: (id: string) => void;
}) {
  const { t, plural } = useText();
  return (
    <div
      className="t-a-strip t-stagger"
      role="list"
      aria-label={t("a.overview.areas")}
      data-testid="district-strip"
    >
      {domains.map((d) => {
        const fs = features.filter((f) => f.domain === d.id);
        const s = fs.reduce((a, f) => a + f.scenarios, 0);
        const p = fs.reduce((a, f) => a + f.proven, 0);
        return (
          <div role="listitem" key={d.id}>
            <ListRow
              lead={<Ring value={pct(p, s)} size={36} label={d.title} />}
              title={d.title}
              sub={`${plural("a.product.stripRecords", fs.length)} · ${plural(
                "a.product.stripCapabilities",
                d.capabilities.length,
              )}`}
              trail={<Icon name="chevronRight" size={14} />}
              onClick={() => onOpenDomain?.(d.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
