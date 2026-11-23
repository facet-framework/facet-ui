import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  AppBar,
  AppShell,
  Button,
  ColorSwatches,
  Dialog,
  Icon,
  IconButton,
  Kbd,
  Row,
  Toast,
  ToastRegion,
  Toolbar,
  ToolbarSeparator,
} from "@facet-tools/ui";
import {
  STORAGE_KEY,
  anchor,
  colorOf,
  colors,
  connect,
  fitView,
  load,
  note,
  parse,
  removeNotes,
  zoomAt,
  type Board,
  type Note,
  type NoteColor,
  type View,
} from "./board";

type Tool = "select" | "note" | "connect";
type Notice = { id: number; text: string; tone?: "ok" | "bad"; restore?: Board };
type Gesture =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | { kind: "drag"; id: string; dx: number; dy: number; moved: boolean };

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** `?fresh` starts from the sample board and ignores what this browser saved. */
const fresh = new URLSearchParams(location.search).has("fresh");

export function App() {
  const [board, setBoard] = useState<Board>(() => load(fresh ? null : storage()));
  const [history, setHistory] = useState<Board[]>([]);
  const [view, setView] = useState<View>({ x: 80, y: 80, zoom: 1 });
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const noticeId = useRef(0);
  const notify = useCallback((notice: Omit<Notice, "id">) => {
    noticeId.current += 1;
    const id = noticeId.current;
    setNotices((list) => [...list.slice(-2), { ...notice, id }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setNotices((list) => list.filter((n) => n.id !== id));
  }, []);
  const [confirmClear, setConfirmClear] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const commit = useCallback(
    (next: Board) => {
      setHistory((h) => [...h.slice(-49), board]);
      setBoard(next);
    },
    [board],
  );
  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setBoard(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);
  const update = (id: string, patch: Partial<Note>) =>
    setBoard((b) => ({ ...b, notes: b.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));

  // Saving: every change lands in this browser's storage; a refusal is shown, not swallowed.
  useEffect(() => {
    if (fresh) return;
    // Debounced: a drag changes the board on every pointer move.
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [board]);

  const fit = useCallback(() => {
    const box = area.current?.getBoundingClientRect();
    if (box) setView(fitView(board.notes, box.width, box.height));
  }, [board.notes]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fit once on open, not on every edit
  useEffect(fit, []);

  const toWorld = (clientX: number, clientY: number) => {
    const box = area.current!.getBoundingClientRect();
    return {
      x: (clientX - box.left - view.x) / view.zoom,
      y: (clientY - box.top - view.y) / view.zoom,
    };
  };

  const addNote = (x: number, y: number, edit = true) => {
    const n = note(x - 90, y - 70, "", board.notes.find((m) => m.id === selected)?.color);
    commit({ ...board, notes: [...board.notes, n] });
    setSelected(n.id);
    if (edit) setEditing(n.id);
    setTool("select");
  };

  // Wheel: scroll pans, Ctrl or ⌘ with the wheel (and pinch) zooms around the pointer.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        setView((v) =>
          zoomAt(v, Math.exp(-e.deltaY * 0.01), e.clientX - box.left, e.clientY - box.top),
        );
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || (e.target as HTMLElement).closest("input, textarea, [role=dialog]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        commit(removeNotes(board, new Set([selected])));
        setSelected(null);
      } else if (e.key === "Enter" && selected) {
        e.preventDefault();
        setEditing(selected);
      } else if (e.key === "Escape") {
        setSelected(null);
        setLinkFrom(null);
        setTool("select");
      } else if (e.key === "v") setTool("select");
      else if (e.key === "n") setTool("note");
      else if (e.key === "c") setTool("connect");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, commit, editing, selected, undo]);

  const onBackgroundDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    setSelected(null);
    setEditing(null);
    setLinkFrom(null);
    if (tool === "note") {
      const p = toWorld(e.clientX, e.clientY);
      addNote(p.x, p.y);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  };

  const onNoteDown = (e: PointerEvent<HTMLDivElement>, n: Note) => {
    e.stopPropagation();
    if (editing === n.id) return;
    if (tool === "connect") {
      if (linkFrom) {
        commit(connect(board, linkFrom, n.id));
        setLinkFrom(null);
        setSelected(n.id);
      } else setLinkFrom(n.id);
      return;
    }
    setSelected(n.id);
    setEditing(null);
    area.current!.setPointerCapture(e.pointerId);
    const p = toWorld(e.clientX, e.clientY);
    gesture.current = { kind: "drag", id: n.id, dx: p.x - n.x, dy: p.y - n.y, moved: false };
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pan") {
      setView((v) => ({ ...v, x: g.vx + e.clientX - g.sx, y: g.vy + e.clientY - g.sy }));
    } else {
      if (!g.moved) {
        setHistory((h) => [...h.slice(-49), board]);
        g.moved = true;
      }
      const p = toWorld(e.clientX, e.clientY);
      update(g.id, { x: Math.round(p.x - g.dx), y: Math.round(p.y - g.dy) });
    }
  };

  const exportBoard = () => {
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${board.name.replace(/[^\w-]+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBoard = async (f: File | undefined) => {
    if (!f) return;
    try {
      commit(parse(await f.text()));
      setSelected(null);
      notify({ text: `Opened ${f.name}`, tone: "ok" });
      requestAnimationFrame(fit);
    } catch {
      notify({ text: `${f.name} is not a board file`, tone: "bad" });
    }
  };

  const sel = board.notes.find((n) => n.id === selected);
  const byId = new Map(board.notes.map((n) => [n.id, n]));

  return (
    <AppShell
      theme={{ theme: "paper", mode: "light" }}
      top={
        <AppBar
          brand={
            <>
              <Icon name="board" size={20} /> Board
            </>
          }
          title={board.name}
          meta={`${board.notes.filter((n) => n.kind === "note").length} notes · ${saved ? "saved in this browser" : "not saved"}`}
          actions={
            <>
              <Button icon="upload" variant="quiet" onClick={() => file.current?.click()}>
                Open
              </Button>
              <input
                ref={file}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  void importBoard(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button icon="download" onClick={exportBoard}>
                Export
              </Button>
              <IconButton icon="trash" label="Clear board" onClick={() => setConfirmClear(true)} />
            </>
          }
        />
      }
      overlay={
        <>
          <Dialog
            open={confirmClear}
            title="Clear the board?"
            onClose={() => setConfirmClear(false)}
            footer={
              <>
                <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    const before = board;
                    commit({ ...board, notes: [], edges: [] });
                    setConfirmClear(false);
                    notify({ text: `Cleared ${before.notes.length} items`, restore: before });
                  }}
                >
                  Clear
                </Button>
              </>
            }
          >
            {board.notes.length} items will be removed. <Kbd>Ctrl</Kbd> <Kbd>Z</Kbd> brings them
            back.
          </Dialog>
          <ToastRegion>
            {notices.map((n) => (
              <Toast
                key={n.id}
                tone={n.tone}
                onUndo={n.restore ? () => setBoard(n.restore as Board) : undefined}
                onDismissed={() => dismiss(n.id)}
              >
                {n.text}
              </Toast>
            ))}
          </ToastRegion>
        </>
      }
    >
      <div
        ref={area}
        className="board"
        data-tool={tool}
        role="application"
        aria-label="Board"
        style={{
          backgroundPosition: `${view.x}px ${view.y}px`,
          backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px`,
        }}
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerUp={() => (gesture.current = null)}
        onDoubleClick={(e) => {
          if (e.target !== e.currentTarget) return;
          const p = toWorld(e.clientX, e.clientY);
          addNote(p.x, p.y);
        }}
      >
        <div
          className="board__world"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
        >
          <svg className="board__edges" aria-hidden="true">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M0 1L9 5L0 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </marker>
            </defs>
            {board.edges.map((e) => {
              const a = byId.get(e.from)!;
              const b = byId.get(e.to)!;
              const p = anchor(a, { x: b.x + b.w / 2, y: b.y + b.h / 2 });
              const q = anchor(b, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
              const mx = (p.x + q.x) / 2;
              return (
                <path
                  key={e.id}
                  d={`M${p.x} ${p.y} C${mx} ${p.y} ${mx} ${q.y} ${q.x} ${q.y}`}
                  markerEnd="url(#arrow)"
                />
              );
            })}
          </svg>
          {board.notes.map((n) => (
            <div
              key={n.id}
              className="board__note"
              data-kind={n.kind}
              data-selected={n.id === selected || n.id === linkFrom || undefined}
              style={{
                left: n.x,
                top: n.y,
                width: n.w,
                minHeight: n.h,
                zIndex: n.id === selected ? 2 : undefined,
                background: n.kind === "note" ? colorOf(n.color) : undefined,
              }}
              onPointerDown={(e) => onNoteDown(e, n)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setSelected(n.id);
                setEditing(n.id);
              }}
            >
              {editing === n.id ? (
                <textarea
                  className="board__edit"
                  aria-label="Note text"
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- editing starts on request
                  autoFocus
                  defaultValue={n.text}
                  onBlur={(e) => {
                    if (e.target.value !== n.text)
                      commit({
                        ...board,
                        notes: board.notes.map((m) =>
                          m.id === n.id ? { ...m, text: e.target.value } : m,
                        ),
                      });
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey)))
                      e.currentTarget.blur();
                  }}
                />
              ) : (
                n.text || <span className="board__placeholder">Empty note</span>
              )}
            </div>
          ))}
        </div>

        <Toolbar label="Tools" orientation="vertical" floating className="board__tools">
          {(
            [
              ["select", "Select and move", "cursor", "V"],
              ["note", "Add a note", "note", "N"],
              ["connect", "Connect two notes", "flow", "C"],
            ] as const
          ).map(([t, label, icon, key]) => (
            <IconButton
              key={t}
              icon={icon}
              label={`${label} (${key})`}
              pressed={tool === t}
              onClick={() => setTool(t)}
            />
          ))}
          <ToolbarSeparator />
          <IconButton
            icon="rotateLeft"
            label="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={!history.length}
          />
        </Toolbar>

        <Toolbar label="Zoom" floating className="board__zoom">
          <IconButton
            icon="minus"
            label="Zoom out"
            onClick={() =>
              setView((v) =>
                zoomAt(v, 1 / 1.2, area.current!.clientWidth / 2, area.current!.clientHeight / 2),
              )
            }
          />
          <span className="board__pct t-num">{Math.round(view.zoom * 100)}%</span>
          <IconButton
            icon="plus"
            label="Zoom in"
            onClick={() =>
              setView((v) =>
                zoomAt(v, 1.2, area.current!.clientWidth / 2, area.current!.clientHeight / 2),
              )
            }
          />
          <ToolbarSeparator />
          <IconButton icon="fit" label="Show everything" onClick={fit} />
        </Toolbar>

        {sel && !editing && sel.kind === "note" ? (
          <Toolbar
            label="Note"
            floating
            className="board__context"
            style={{
              left: view.x + sel.x * view.zoom,
              top: view.y + (sel.y + sel.h) * view.zoom + 12,
            }}
          >
            <ColorSwatches<NoteColor>
              label="Note colour"
              value={sel.color}
              options={colors}
              onChange={(c) =>
                commit({
                  ...board,
                  notes: board.notes.map((n) => (n.id === sel.id ? { ...n, color: c } : n)),
                })
              }
            />
            <ToolbarSeparator />
            <IconButton icon="edit" label="Edit (Enter)" onClick={() => setEditing(sel.id)} />
            <IconButton
              icon="copy"
              label="Duplicate"
              onClick={() => {
                const copy = { ...note(sel.x + 24, sel.y + 24, sel.text, sel.color) };
                commit({ ...board, notes: [...board.notes, copy] });
                setSelected(copy.id);
              }}
            />
            <IconButton
              icon="trash"
              label="Delete (Del)"
              onClick={() => {
                commit(removeNotes(board, new Set([sel.id])));
                setSelected(null);
              }}
            />
          </Toolbar>
        ) : null}

        {tool === "connect" ? (
          <Row className="board__hint t-float" gap={2}>
            <Icon name="flow" size={14} />
            {linkFrom ? "Pick the second note" : "Pick the first note"}
          </Row>
        ) : null}
      </div>
    </AppShell>
  );
}
