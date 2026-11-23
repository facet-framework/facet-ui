/** The board's data: notes, labels and the arrows between them. Pure functions only. */

export type NoteColor = "yellow" | "pink" | "blue" | "green" | "violet";

export type Note = {
  id: string;
  kind: "note" | "label";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: NoteColor;
};

export type Edge = { id: string; from: string; to: string };

export type Board = { name: string; notes: Note[]; edges: Edge[] };

export type View = { x: number; y: number; zoom: number };

export const STORAGE_KEY = "facet-ui-example.sticky-board";

export const colors: { value: NoteColor; label: string; color: string }[] = [
  { value: "yellow", label: "Yellow", color: "#f7e08a" },
  { value: "pink", label: "Pink", color: "#f4b6c8" },
  { value: "blue", label: "Blue", color: "#b5d3f5" },
  { value: "green", label: "Green", color: "#bfe3c4" },
  { value: "violet", label: "Violet", color: "#d6c8f2" },
];

export const colorOf = (c: NoteColor) => colors.find((x) => x.value === c)!.color;

export const newId = () => Math.random().toString(36).slice(2, 10);

export function note(x: number, y: number, text = "", color: NoteColor = "yellow"): Note {
  return { id: newId(), kind: "note", x, y, w: 180, h: 140, text, color };
}

const label = (x: number, y: number, text: string): Note => ({
  ...note(x, y, text),
  kind: "label",
  w: 360,
  h: 48,
});

export function seed(): Board {
  const n = (x: number, y: number, text: string, color: NoteColor, id: string): Note => ({
    ...note(x, y, text, color),
    id,
  });
  const notes: Note[] = [
    label(0, 0, "Went well"),
    n(0, 70, "Release went out on the planned day", "green", "a1"),
    n(200, 70, "Pairing on the checkout bug", "green", "a2"),
    n(0, 230, "Support tickets down 30 %", "green", "a3"),
    label(460, 0, "Could be better"),
    n(460, 70, "Flaky end-to-end tests block merges", "pink", "b1"),
    n(660, 70, "Too many meetings on Tuesdays", "pink", "b2"),
    n(460, 230, "Design reviews come too late", "pink", "b3"),
    label(920, 0, "Try next"),
    n(920, 70, "Quarantine flaky tests automatically", "blue", "c1"),
    n(1120, 70, "Meeting-free Tuesday afternoon", "blue", "c2"),
    n(920, 230, "Review sketches before the first commit", "violet", "c3"),
    n(1120, 230, "Who owns the test dashboard?", "yellow", "c4"),
  ];
  const edges: Edge[] = [
    { id: "e1", from: "b1", to: "c1" },
    { id: "e2", from: "b2", to: "c2" },
    { id: "e3", from: "b3", to: "c3" },
    { id: "e4", from: "c1", to: "c4" },
  ];
  return { name: "Team retro · week 47", notes, edges };
}

export function load(storage: Pick<Storage, "getItem"> | null): Board {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return seed();
    return parse(raw);
  } catch {
    return seed();
  }
}

/** Reads a board from JSON and refuses anything that is not one. */
export function parse(raw: string): Board {
  const data = JSON.parse(raw) as Partial<Board>;
  if (typeof data.name !== "string" || !Array.isArray(data.notes) || !Array.isArray(data.edges)) {
    throw new Error("Not a board file");
  }
  const ids = new Set(data.notes.map((n) => n.id));
  return {
    name: data.name,
    notes: data.notes,
    edges: data.edges.filter((e) => ids.has(e.from) && ids.has(e.to)),
  };
}

export function removeNotes(board: Board, ids: Set<string>): Board {
  return {
    ...board,
    notes: board.notes.filter((n) => !ids.has(n.id)),
    edges: board.edges.filter((e) => !ids.has(e.from) && !ids.has(e.to)),
  };
}

export function connect(board: Board, from: string, to: string): Board {
  if (from === to) return board;
  const exists = board.edges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
  if (exists) return board;
  return { ...board, edges: [...board.edges, { id: newId(), from, to }] };
}

/** The point on a note's border in the direction of another point. */
export function anchor(n: Note, toward: { x: number; y: number }) {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const scale = Math.min(
    dx ? n.w / 2 / Math.abs(dx) : Infinity,
    dy ? n.h / 2 / Math.abs(dy) : Infinity,
  );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

/** The view that shows every note with a margin. */
export function fitView(notes: Note[], width: number, height: number): View {
  if (!notes.length) return { x: width / 2, y: height / 2, zoom: 1 };
  const minX = Math.min(...notes.map((n) => n.x));
  const minY = Math.min(...notes.map((n) => n.y));
  const maxX = Math.max(...notes.map((n) => n.x + n.w));
  const maxY = Math.max(...notes.map((n) => n.y + n.h));
  const margin = 80;
  const zoom = clampZoom(
    Math.min((width - margin * 2) / (maxX - minX), (height - margin * 2) / (maxY - minY)),
  );
  return {
    zoom,
    x: (width - (maxX - minX) * zoom) / 2 - minX * zoom,
    y: (height - (maxY - minY) * zoom) / 2 - minY * zoom,
  };
}

export const clampZoom = (z: number) => Math.max(0.25, Math.min(2.5, z));

/** Zooms around a screen point so that the point stays under the pointer. */
export function zoomAt(view: View, factor: number, px: number, py: number): View {
  const zoom = clampZoom(view.zoom * factor);
  const k = zoom / view.zoom;
  return { zoom, x: px - (px - view.x) * k, y: py - (py - view.y) * k };
}
