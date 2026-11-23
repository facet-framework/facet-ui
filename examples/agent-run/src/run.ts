/** A scripted multi-agent run, replayed on a clock. */

export type StepKind = "plan" | "read" | "edit" | "test" | "review";

export type Agent = {
  id: string;
  name: string;
  role: string;
};

export type Step = {
  id: string;
  agent: string;
  kind: StepKind;
  label: string;
  /** Seconds since the run started. */
  start: number;
  end: number;
  tokens: number;
  files?: string[];
  /** The outcome when the step ends. */
  result?: "ok" | "warn" | "bad";
};

export const run = {
  id: 218,
  title: "Add CSV export to invoices",
  branch: "feat/invoice-csv-export",
  duration: 240,
};

export const agents: Agent[] = [
  { id: "planner", name: "Planner", role: "Breaks the task down" },
  { id: "builder", name: "Builder", role: "Writes the code" },
  { id: "tester", name: "Tester", role: "Runs and writes tests" },
  { id: "reviewer", name: "Reviewer", role: "Reads every diff" },
];

export const kinds: { kind: StepKind; label: string; tone: 1 | 2 | 3 | 4 }[] = [
  { kind: "read", label: "Reading", tone: 1 },
  { kind: "edit", label: "Editing", tone: 2 },
  { kind: "test", label: "Testing", tone: 3 },
  { kind: "review", label: "Reviewing", tone: 4 },
  { kind: "plan", label: "Planning", tone: 1 },
];

let n = 0;
const s = (
  agent: string,
  kind: StepKind,
  label: string,
  start: number,
  end: number,
  tokens: number,
  extra: Partial<Step> = {},
): Step => ({ id: `s${++n}`, agent, kind, label, start, end, tokens, ...extra });

export const steps: Step[] = [
  s("planner", "read", "Read the issue and invoice module", 0, 14, 4200, {
    files: ["src/invoices/index.ts", "src/invoices/model.ts"],
  }),
  s("planner", "plan", "Split into 4 tasks", 14, 26, 2600, { result: "ok" }),
  s("builder", "read", "Read the export service", 26, 38, 3100, {
    files: ["src/export/service.ts"],
  }),
  s("tester", "read", "Read the existing invoice tests", 26, 40, 2900, {
    files: ["test/invoices.spec.ts"],
  }),
  s("builder", "edit", "Add toCsv() with quoting rules", 38, 82, 9800, {
    files: ["src/export/csv.ts"],
    result: "ok",
  }),
  s("tester", "test", "Write cases for commas, quotes and line breaks", 40, 78, 7400, {
    files: ["test/csv.spec.ts"],
    result: "ok",
  }),
  s("planner", "plan", "Hand task 2 to Builder", 82, 88, 900),
  s("builder", "edit", "Wire the Export button to the service", 88, 128, 8200, {
    files: ["src/invoices/Toolbar.tsx", "src/export/service.ts"],
    result: "ok",
  }),
  s("tester", "test", "Run the invoice suite", 82, 104, 1800, { result: "bad" }),
  s("reviewer", "review", "Review toCsv()", 84, 112, 5200, { result: "warn" }),
  s("builder", "edit", "Escape formula prefixes (=, +, -, @)", 128, 156, 6100, {
    files: ["src/export/csv.ts"],
    result: "ok",
  }),
  s("tester", "test", "Rerun the invoice suite", 156, 178, 1700, { result: "ok" }),
  s("reviewer", "review", "Review the toolbar wiring", 130, 160, 4800, { result: "ok" }),
  s("tester", "test", "Add an end-to-end download test", 178, 212, 5600, {
    files: ["e2e/invoice-export.spec.ts"],
    result: "ok",
  }),
  s("reviewer", "review", "Final review of 5 files", 212, 236, 6300, { result: "ok" }),
  s("planner", "plan", "Open pull request", 236, 240, 700, { result: "ok" }),
];

/** What the run reports at a moment. */
export function snapshot(t: number) {
  const started = steps.filter((x) => x.start <= t);
  const done = started.filter((x) => x.end <= t);
  const active = started.filter((x) => x.end > t);
  const progress = (x: Step) => Math.max(0, Math.min(1, (t - x.start) / (x.end - x.start)));
  const tokens = started.reduce((sum, x) => sum + Math.round(x.tokens * progress(x)), 0);
  const files = new Set(done.filter((x) => x.kind === "edit").flatMap((x) => x.files ?? []));
  const tests = done.filter((x) => x.kind === "test");
  return { started, done, active, tokens, files: [...files], tests, progress };
}

/** Tokens per bucket of `size` seconds up to `t`, for sparklines. */
export function tokenSeries(t: number, agent?: string, size = 12): number[] {
  const out: number[] = [];
  for (let from = 0; from < Math.max(t, size); from += size) {
    const to = Math.min(from + size, t);
    let sum = 0;
    for (const x of steps) {
      if (agent && x.agent !== agent) continue;
      const overlap = Math.max(0, Math.min(x.end, to) - Math.max(x.start, from));
      sum += (x.tokens * overlap) / (x.end - x.start);
    }
    out.push(Math.round(sum));
  }
  return out;
}

export const clock = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
