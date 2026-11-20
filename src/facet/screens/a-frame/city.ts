import type { DomainView, FeatureView } from "./model";

export const ISO_C = Math.cos(Math.PI / 6);
export const ISO_S = 0.5;

export function iso(x: number, y: number, z = 0): [number, number] {
  return [(x - y) * ISO_C, (x + y) * ISO_S - z];
}

export type Building = { feature: FeatureView; x: number; y: number; w: number; h: number };
export type Plate = { key: string; label: string; x: number; y: number; w: number; d: number };
export type CityLayout = {
  buildings: Building[];
  districts: (Plate & { domain: string })[];
  blocks: (Plate & { domain: string; capability: string })[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
};

const FOOT = 1;
const GAP = 0.45;
const BLOCK_PAD = 0.6;
const STREET = 1.4;
const DISTRICT_PAD = 1.1;
const DISTRICT_GAP = 3;

export function buildingHeight(f: FeatureView) {
  if (f.lifecycle === "planned" || f.scenarios === 0) return 0.25;
  return 0.4 + f.scenarios * 0.32;
}

export function layoutCity(domains: DomainView[], features: FeatureView[]): CityLayout {
  const buildings: Building[] = [];
  const blocks: CityLayout["blocks"] = [];
  const districts: CityLayout["districts"] = [];

  const measured = domains.map((d) => {
    const caps = d.capabilities.map((c) => {
      const fs = features.filter((f) => f.domain === d.id && f.capability === c.id);
      const cols = Math.max(1, Math.ceil(Math.sqrt(fs.length)));
      const rows = Math.max(1, Math.ceil(fs.length / cols));
      const w = cols * FOOT + (cols - 1) * GAP + BLOCK_PAD * 2;
      const dpt = rows * FOOT + (rows - 1) * GAP + BLOCK_PAD * 2;
      return { c, fs, cols, w, d: dpt };
    });
    const perRow = Math.max(1, Math.ceil(Math.sqrt(caps.length)));
    const rowsOf: (typeof caps)[] = [];
    for (let i = 0; i < caps.length; i += perRow) rowsOf.push(caps.slice(i, i + perRow));
    const width =
      Math.max(4, ...rowsOf.map((r) => r.reduce((a, c) => a + c.w, 0) + (r.length - 1) * STREET)) +
      DISTRICT_PAD * 2;
    const depth =
      Math.max(
        4,
        rowsOf.reduce((a, r) => a + Math.max(...r.map((c) => c.d)), 0) +
          (rowsOf.length - 1) * STREET,
      ) +
      DISTRICT_PAD * 2;
    return { d, rowsOf, width, depth };
  });

  const area = measured.reduce((a, m) => a + m.width * m.depth, 0);
  const maxRow = Math.max(Math.sqrt(area) * 1.25, ...measured.map((m) => m.width));
  let cx = 0;
  let cy = 0;
  let rowDepth = 0;
  for (const m of measured) {
    if (cx > 0 && cx + m.width > maxRow) {
      cx = 0;
      cy += rowDepth + DISTRICT_GAP;
      rowDepth = 0;
    }
    districts.push({
      key: m.d.id,
      domain: m.d.id,
      label: m.d.title,
      x: cx,
      y: cy,
      w: m.width,
      d: m.depth,
    });
    let by = cy + DISTRICT_PAD;
    for (const row of m.rowsOf) {
      let bx = cx + DISTRICT_PAD;
      for (const cap of row) {
        blocks.push({
          key: `${m.d.id}/${cap.c.id}`,
          domain: m.d.id,
          capability: cap.c.id,
          label: cap.c.title,
          x: bx,
          y: by,
          w: cap.w,
          d: cap.d,
        });
        cap.fs.forEach((f, i) => {
          const col = i % cap.cols;
          const r = Math.floor(i / cap.cols);
          buildings.push({
            feature: f,
            x: bx + BLOCK_PAD + col * (FOOT + GAP),
            y: by + BLOCK_PAD + r * (FOOT + GAP),
            w: FOOT,
            h: buildingHeight(f),
          });
        });
        bx += cap.w + STREET;
      }
      by += Math.max(...row.map((c) => c.d)) + STREET;
    }
    cx += m.width + DISTRICT_GAP;
    rowDepth = Math.max(rowDepth, m.depth);
  }

  buildings.sort((a, b) => a.x + a.y - (b.x + b.y));

  return { buildings, districts, blocks, bounds: boundsOf(districts, buildings) };
}

export function turnCity(city: CityLayout, quarter: number): CityLayout {
  const q = ((quarter % 4) + 4) % 4;
  if (q === 0) return city;
  const rect = <T extends { x: number; y: number }>(r: T, w: number, d: number) => {
    let { x, y } = r;
    let rw = w;
    let rd = d;
    for (let i = 0; i < q; i += 1) {
      [x, y, rw, rd] = [-(y + rd), x, rd, rw];
    }
    return { x, y, w: rw, d: rd };
  };
  const districts = city.districts.map((d) => ({ ...d, ...rect(d, d.w, d.d) }));
  const blocks = city.blocks.map((b) => ({ ...b, ...rect(b, b.w, b.d) }));
  const buildings = city.buildings
    .map((b) => {
      const r = rect(b, b.w, b.w);
      return { ...b, x: r.x, y: r.y };
    })
    .sort((a, b) => a.x + a.y - (b.x + b.y));
  return { buildings, districts, blocks, bounds: boundsOf(districts, buildings) };
}

function boundsOf(districts: Plate[], buildings: Building[]): CityLayout["bounds"] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (p: [number, number]) => {
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  };
  for (const d of districts) {
    grow(iso(d.x, d.y));
    grow(iso(d.x + d.w, d.y));
    grow(iso(d.x, d.y + d.d));
    grow(iso(d.x + d.w, d.y + d.d));
  }
  for (const b of buildings) grow(iso(b.x, b.y, b.h));
  if (!districts.length) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return { minX, minY, maxX, maxY };
}

export type ViewBox = { x: number; y: number; w: number; h: number };

export const ZOOM_IN_MAX = 8;
export const ZOOM_OUT_MAX = 1.5;

export function clampView(v: ViewBox, base: ViewBox): ViewBox {
  const w = Math.min(base.w * ZOOM_OUT_MAX, Math.max(base.w / ZOOM_IN_MAX, v.w));
  const h = (v.h / v.w) * w;
  let cx = v.x + v.w / 2;
  let cy = v.y + v.h / 2;
  cx = Math.min(base.x + base.w, Math.max(base.x, cx));
  cy = Math.min(base.y + base.h, Math.max(base.y, cy));
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function zoomView(v: ViewBox, factor: number, at: [number, number], base: ViewBox) {
  const w = Math.min(base.w * ZOOM_OUT_MAX, Math.max(base.w / ZOOM_IN_MAX, v.w / factor));
  const f = v.w / w;
  return clampView(
    { x: at[0] - (at[0] - v.x) / f, y: at[1] - (at[1] - v.y) / f, w, h: v.h / f },
    base,
  );
}

export function panView(v: ViewBox, dx: number, dy: number, base: ViewBox) {
  return clampView({ ...v, x: v.x + dx, y: v.y + dy }, base);
}

export function quad(pts: [number, number, number][], unit: number) {
  return pts
    .map(([x, y, z]) => {
      const [sx, sy] = iso(x, y, z);
      return `${(sx * unit).toFixed(1)},${(sy * unit).toFixed(1)}`;
    })
    .join(" ");
}

export type Rect = { x: number; y: number; w: number; h: number };

export function squarify(values: number[], r: Rect): Rect[] {
  const total = values.reduce((a, v) => a + v, 0);
  const out: Rect[] = new Array(values.length);
  if (!total || !values.length) return values.map(() => ({ x: r.x, y: r.y, w: 0, h: 0 }));
  const scale = (r.w * r.h) / total;
  const items = values.map((v, i) => ({ i, a: v * scale })).sort((a, b) => b.a - a.a);
  let rect = { ...r };
  let row: typeof items = [];
  const worst = (rw: typeof items, side: number) => {
    const s = rw.reduce((a, x) => a + x.a, 0);
    const mx = Math.max(...rw.map((x) => x.a));
    const mn = Math.min(...rw.map((x) => x.a));
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  const flush = () => {
    const s = row.reduce((a, x) => a + x.a, 0);
    const horizontal = rect.w >= rect.h;
    const side = horizontal ? rect.h : rect.w;
    const thick = side ? s / side : 0;
    let off = 0;
    for (const it of row) {
      const len = thick ? it.a / thick : 0;
      out[it.i] = horizontal
        ? { x: rect.x, y: rect.y + off, w: thick, h: len }
        : { x: rect.x + off, y: rect.y, w: len, h: thick };
      off += len;
    }
    rect = horizontal
      ? { x: rect.x + thick, y: rect.y, w: rect.w - thick, h: rect.h }
      : { x: rect.x, y: rect.y + thick, w: rect.w, h: rect.h - thick };
    row = [];
  };
  for (const it of items) {
    const side = Math.min(rect.w, rect.h);
    if (!row.length || worst([...row, it], side) <= worst(row, side)) {
      row.push(it);
    } else {
      flush();
      row.push(it);
    }
  }
  if (row.length) flush();
  return out;
}

export function wrapLabel(label: string, n: number): string[] {
  const width = Math.max(1, Math.floor(n));
  const lines: string[] = [];
  let line = "";
  for (const word of label.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line = `${line} ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
