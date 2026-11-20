/**
 * Live corpus — the same corpus as in `corpus.ts`, only not from files in the
 * bundle but from a running repo.
 *
 * A host (the `facet` binary with `facet ui`) reads the repo and sends
 * intermediate states while doing so: which phase is running, which file is
 * being read, how many there are in total. At the end comes exactly the
 * `CorpusSource` that `loadCorpus` expects — the data layer stays the same,
 * only the origin is a different one.
 *
 * The progress is measured, not estimated: every number here is a file the
 * host counted. A progress bar that guesses the time would be a claim with no
 * field behind it — and thus the same as an invented metric.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import type { CorpusSource } from "./corpus";

/**
 * The phases of a run, in their order.
 *
 * The keys are the protocol between host and UI and therefore stay English;
 * the plain-language texts live in the UI.
 */
export const INDEX_PHASES = [
  "connect",
  "config",
  "records",
  "enumerate",
  "index",
  "model",
  "ready",
] as const;

export type IndexPhase = (typeof INDEX_PHASES)[number];

/** Rank of a phase in the order — `-1` if it is unknown. */
export function phaseRank(phase: IndexPhase | string): number {
  return INDEX_PHASES.indexOf(phase as IndexPhase);
}

/**
 * An intermediate state of reading in. All counts are running totals over the
 * whole run; `done` and `total` refer to the *current* phase, because only it
 * has a share that means something.
 */
export type IndexStatus = {
  phase: IndexPhase;
  /** Most recently touched file, relative to the repo root. Empty if none. */
  file: string;
  /** Completed units of the current phase. */
  done: number;
  /** Reference total of the current phase. `0` means: not known yet. */
  total: number;
  /** Record files read. */
  records: number;
  /** Source files searched. */
  files: number;
  anchors: number;
  /** Repo root the host reads. Empty until it names it. */
  root: string;
  /** Registry of the run. Empty if the project has only the one. */
  registry: string;
};

/** The zero state a UI starts with before the host answers. */
export function initialStatus(): IndexStatus {
  return {
    phase: "connect",
    file: "",
    done: 0,
    total: 0,
    records: 0,
    files: 0,
    anchors: 0,
    root: "",
    registry: "",
  };
}

/**
 * Fills a partial state sent by the host up to a complete one.
 *
 * What belongs to the run (`records`, `files`, `anchors`, `root`, `registry`)
 * carries over when the host leaves it out. The phase-bound fields (`file`,
 * `done`, `total`) fall back to zero: they belong to the phase, and what was
 * left of the previous one would be a wrong number in the new one.
 */
export function mergeStatus(previous: IndexStatus, patch: Partial<IndexStatus>): IndexStatus {
  return {
    phase: patch.phase ?? previous.phase,
    file: patch.file ?? "",
    done: patch.done ?? 0,
    total: patch.total ?? 0,
    records: patch.records ?? previous.records,
    files: patch.files ?? previous.files,
    anchors: patch.anchors ?? previous.anchors,
    root: patch.root ?? previous.root,
    registry: patch.registry ?? previous.registry,
  };
}

export type CorpusStreamHandlers = {
  /** An intermediate state has arrived. */
  onStatus?: (status: IndexStatus) => void;
  /** The corpus is completely ready. */
  onReady?: (source: CorpusSource) => void;
  /** The run failed — aborted, no partial result. */
  onError?: (error: Error) => void;
};

/** The part of `EventSource` this reader needs. */
export type CorpusStream = {
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  close(): void;
};

export type CorpusStreamOptions = {
  /**
   * Creates the stream. The default is the browser's `EventSource`; tests and
   * other hosts pass in their own version.
   */
  open?: (url: string) => CorpusStream;
  /** The language of the error messages handed to `onError`; English by default. */
  text?: FacetText;
};

/**
 * Reads a host's corpus stream.
 *
 * The return value is the unsubscribe: it closes the stream so that a reload
 * does not leave a second connection open. After `ready` or `failed` the
 * reader closes itself — a finished run has nothing left to send.
 */
export function subscribeCorpus(
  url: string,
  handlers: CorpusStreamHandlers = {},
  options: CorpusStreamOptions = {},
): () => void {
  const open = options.open ?? defaultOpen;
  const { t } = options.text ?? ENGLISH_TEXT;
  const decode = <T>(data: string) => decodeWith<T>(data, t);
  const stream = open(url);

  let status = initialStatus();
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    stream.close();
  };

  const fail = (error: Error) => {
    if (closed) return;
    close();
    handlers.onError?.(error);
  };

  stream.addEventListener("status", (event) => {
    const patch = decode<Partial<IndexStatus>>(event.data);
    if (patch instanceof Error) return fail(patch);
    status = mergeStatus(status, patch);
    handlers.onStatus?.(status);
  });

  stream.addEventListener("ready", (event) => {
    const source = decode<CorpusSource>(event.data);
    if (source instanceof Error) return fail(source);
    if (closed) return;
    close();
    handlers.onReady?.(source);
  });

  // A host error is called 'failed' and not 'error': 'error' is the connection
  // error of EventSource itself, and two meanings on one name could no longer
  // be told apart on the receiving side.
  stream.addEventListener("failed", (event) => {
    const payload = decode<{ message?: string }>(event.data);
    if (payload instanceof Error) return fail(payload);
    fail(new Error(payload.message || t("core.live.aborted")));
  });

  stream.addEventListener("error", () => {
    // The browser also reports the scheduled end as an error. After 'ready'
    // the reader is already closed, and then there is nothing left to do here.
    fail(new Error(t("core.live.noConnection", { url })));
  });

  return close;
}

function defaultOpen(url: string): CorpusStream {
  if (typeof EventSource === "undefined") {
    throw new Error("This host has no EventSource — pass `open`.");
  }
  return new EventSource(url);
}

/** Returns the parsed value or the error it failed on. */
function decodeWith<T>(data: string, t: FacetText["t"]): T | Error {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    return new Error(t("core.live.unreadable", { message: (error as Error).message }));
  }
}
