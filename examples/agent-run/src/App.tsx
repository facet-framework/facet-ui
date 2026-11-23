import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  AppBar,
  AppShell,
  Avatar,
  Badge,
  Button,
  ConfirmButton,
  Grid,
  Icon,
  Meter,
  Page,
  Row,
  Section,
  Segment,
  Sparkline,
  Stack,
  Metric,
  Surface,
  Timeline,
  chartColor,
  type TimelineItem,
} from "@facet-tools/ui";
import { agents, clock, kinds, run, snapshot, steps, tokenSeries, type Step } from "./run";

const params = new URLSearchParams(location.search);
/** `?at=120` freezes the replay at that second (used for screenshots). */
const frozen = params.has("at") ? Number(params.get("at")) : null;
const toneOf = (x: Step) => kinds.find((k) => k.kind === x.kind)!.tone;
const kindLabel = (x: Step) => kinds.find((k) => k.kind === x.kind)!.label;
const resultTone = { ok: "ok", warn: "warn", bad: "bad" } as const;
const resultWord = { ok: "passed", warn: "changes requested", bad: "failed" } as const;

function useClock() {
  const [t, setT] = useState(frozen ?? 0);
  const [playing, setPlaying] = useState(frozen == null);
  const [speed, setSpeed] = useState<"1" | "4" | "16">("4");
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((now) => {
        const next = now + Number(speed) / 4;
        if (next >= run.duration) {
          setPlaying(false);
          return run.duration;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing, speed]);
  const [stopped, setStopped] = useState(false);
  return {
    t,
    playing,
    setPlaying,
    speed,
    setSpeed,
    stopped,
    stop: () => (setPlaying(false), setStopped(true)),
    restart: () => (setT(0), setStopped(false), setPlaying(true)),
  };
}

export function App() {
  const c = useClock();
  const snap = useMemo(() => snapshot(c.t), [c.t]);
  const finished = c.t >= run.duration;
  const failing = snap.tests.at(-1)?.result === "bad";

  const events: TimelineItem[] = useMemo(() => {
    const items: (TimelineItem & { at: number })[] = [];
    for (const x of snap.started) {
      const agent = agents.find((a) => a.id === x.agent)!;
      const live = x.end > c.t;
      items.push({
        key: x.id,
        at: live ? x.start : x.end,
        title: (
          <>
            <strong>{agent.name}</strong> · {x.label}
          </>
        ),
        time: clock(live ? x.start : x.end),
        icon: live ? undefined : x.result === "bad" ? "close" : "check",
        tone: live ? "signal" : x.result ? resultTone[x.result] : "neutral",
        live,
        body:
          !live && x.result ? (
            <Row gap={2} wrap>
              <Badge tone={resultTone[x.result]}>{resultWord[x.result]}</Badge>
              {x.files?.map((f) => (
                <span key={f} className="t-meta">
                  {f}
                </span>
              ))}
            </Row>
          ) : undefined,
      });
    }
    return items.sort((a, b) => b.at - a.at).slice(0, 7);
  }, [snap.started, c.t]);

  return (
    <AppShell
      theme={{ theme: "facet", mode: "dark" }}
      top={
        <AppBar
          brand={
            <>
              <Icon name="network" size={20} /> Crew
            </>
          }
          title={`Run #${run.id} · ${run.title}`}
          meta={run.branch}
          actions={
            <>
              <Segment
                label="Replay speed"
                value={c.speed}
                onChange={c.setSpeed}
                options={[
                  { value: "1", label: "1×" },
                  { value: "4", label: "4×" },
                  { value: "16", label: "16×" },
                ]}
              />
              {finished || c.stopped ? (
                <Button icon="refresh" onClick={c.restart}>
                  Replay
                </Button>
              ) : (
                <Button
                  icon={c.playing ? "pause" : "play"}
                  onClick={() => c.setPlaying(!c.playing)}
                >
                  {c.playing ? "Pause" : "Resume"}
                </Button>
              )}
              {finished || c.stopped ? (
                <Button
                  variant="danger"
                  icon="stop"
                  disabledReason={c.stopped ? "Stopped" : "Finished"}
                >
                  Stop
                </Button>
              ) : (
                <ConfirmButton
                  label="Stop"
                  icon="stop"
                  doneLabel="Stopped"
                  onConfirm={() => {
                    c.stop();
                    return true;
                  }}
                />
              )}
            </>
          }
        />
      }
    >
      <Page width="wide">
        <Stack gap={6}>
          <Grid min={180} gap={4} fit>
            <Surface>
              <Metric
                size="large"
                value={c.t}
                format={clock}
                label={
                  finished ? (
                    <Badge tone="ok">Pull request opened</Badge>
                  ) : (
                    <Badge tone={failing ? "bad" : "signal"}>
                      {failing ? "Tests failing" : `${snap.active.length} agents working`}
                    </Badge>
                  )
                }
              />
            </Surface>
            <Surface>
              <Metric value={snap.done.length} of={steps.length} label="Steps done" count />
              <Meter value={snap.done.length / steps.length} thin label="Steps done" />
            </Surface>
            <Surface>
              <Stack gap={2}>
                <Metric value={snap.tokens} label="Tokens" />
                <Sparkline values={tokenSeries(c.t)} label="Tokens per 12 s" area width={160} />
              </Stack>
            </Surface>
            <Surface>
              <Metric value={snap.files.length} label="Files changed" count />
            </Surface>
            <Surface>
              <Metric
                value={snap.tests.filter((x) => x.result === "ok").length}
                of={snap.tests.length}
                tone={failing ? "bad" : snap.tests.length ? "ok" : undefined}
                label="Test runs green"
              />
            </Surface>
          </Grid>

          <Section
            title="Lanes"
            meta={`${clock(c.t)} / ${clock(run.duration)}`}
            actions={
              <Row gap={4} wrap className="t-meta">
                {kinds.slice(0, 4).map((k) => (
                  <Row key={k.kind} gap={1}>
                    <span className="lane-key" style={{ background: chartColor(k.tone) }} />
                    {k.label}
                  </Row>
                ))}
              </Row>
            }
          >
            <Surface>
              <div className="lanes" role="list" aria-label="Agent lanes">
                {agents.map((a) => (
                  <div className="lane" role="listitem" key={a.id}>
                    <Row gap={2} className="lane__who">
                      <Avatar
                        name={a.name}
                        size={26}
                        busy={snap.active.some((x) => x.agent === a.id)}
                      />
                      {a.name}
                    </Row>
                    <div className="lane__track">
                      {snap.started
                        .filter((x) => x.agent === a.id)
                        .map((x) => (
                          <span
                            key={x.id}
                            className="lane__step"
                            title={`${kindLabel(x)}: ${x.label} (${clock(x.start)}–${clock(x.end)})`}
                            data-result={x.end <= c.t ? x.result : undefined}
                            style={{
                              left: `${(x.start / run.duration) * 100}%`,
                              width: `${((Math.min(x.end, c.t) - x.start) / run.duration) * 100}%`,
                              background: chartColor(toneOf(x)),
                            }}
                          />
                        ))}
                    </div>
                  </div>
                ))}
                <span
                  className="lanes__now"
                  aria-hidden="true"
                  style={{ "--at": c.t / run.duration } as CSSProperties}
                />
              </div>
            </Surface>
          </Section>

          <div className="t-cols-main-side">
            <Section title="Agents">
              <Grid min={340} gap={4}>
                {agents.map((a) => {
                  const now = snap.active.find((x) => x.agent === a.id);
                  const mine = steps.filter((x) => x.agent === a.id);
                  const doneMine = mine.filter((x) => x.end <= c.t).length;
                  return (
                    <Surface key={a.id}>
                      <Stack gap={3}>
                        <Row gap={3}>
                          <Avatar
                            name={a.name}
                            size={40}
                            busy={!!now}
                            status={now ? "signal" : doneMine === mine.length ? "ok" : undefined}
                          />
                          <Stack gap={0}>
                            <strong>{a.name}</strong>
                            <span className="t-muted">{a.role}</span>
                          </Stack>
                          <span className="t-spacer" />
                          <Sparkline
                            values={tokenSeries(c.t, a.id)}
                            label={`${a.name} tokens`}
                            tone={2}
                            width={72}
                          />
                        </Row>
                        <div className="agent-now">
                          {now ? (
                            <>
                              <Badge tone="signal">{kindLabel(now)}</Badge> {now.label}
                            </>
                          ) : (
                            <span className="t-muted">
                              {doneMine === mine.length ? "Done" : "Waiting"}
                            </span>
                          )}
                        </div>
                        <Row gap={3}>
                          <Meter
                            value={now ? snap.progress(now) : doneMine === mine.length ? 1 : 0}
                            tone="signal"
                            thin
                            label={`${a.name} current step`}
                          />
                          <span className="t-meta t-num">
                            {doneMine}/{mine.length}
                          </span>
                        </Row>
                      </Stack>
                    </Surface>
                  );
                })}
              </Grid>
            </Section>
            <Section title="Activity">
              <Surface>
                <Timeline label="Recent activity" items={events} />
              </Surface>
            </Section>
          </div>
        </Stack>
      </Page>
    </AppShell>
  );
}
