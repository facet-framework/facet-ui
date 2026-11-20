import { localized } from "../../../i18n/legacy/facet/screens/d-plugins/AskAtlas.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import {
  ChatDock,
  ChatFull,
  ChatPill,
  type ChatMode,
  type ChatTurnVM,
  type ComposerProps,
} from "./Chat";
import { AdrReader } from "./Adr";
import { SLASH, SUGGESTIONS, adrDetail, sessionsVM, turns } from "./storyData";

const tablet = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "tablet" } },
};

const meta: Meta = { title: "Screens/D Plugins/Ask Atlas" };
export default meta;
type Story = StoryObj;

const BEHIND = adrDetail(0);
const Behind = ({ mobile }: { mobile?: boolean }) => <AdrReader {...BEHIND} mobile={mobile} />;

function useComposer(initial = "", opts: Partial<ComposerProps> = {}): ComposerProps {
  const [value, setValue] = useState(initial);
  const [mode, setMode] = useState<ChatMode>("ask");
  const [ctx, setCtx] = useState([
    { key: "adr", label: "ADR 0001", icon: "decision" as const },
    { key: "rec", label: "workspace/board", icon: "taxonomy" as const },
  ]);
  return {
    value,
    mode,
    model: "Opus",
    context: ctx,
    onChange: setValue,
    onMode: setMode,
    onRemoveContext: (k) => setCtx((c) => c.filter((x) => x.key !== k)),
    ...opts,
  };
}

function Pill({ mobile, running }: { mobile?: boolean; running?: boolean }) {
  return (
    <Screen
      area="adr"
      mobile={mobile}
      chat={
        <ChatPill mobile={mobile} running={running} step={running ? localized.text2 : undefined} />
      }
    >
      <Behind mobile={mobile} />
    </Screen>
  );
}

function Dock({
  mobile,
  kind,
  signedOut,
  slash,
  draft = "",
  noHost,
}: {
  noHost?: boolean;
  mobile?: boolean;
  kind: "empty" | "answer" | "streaming" | "cut" | "failed" | "stopped";
  signedOut?: boolean;
  slash?: boolean;
  draft?: string;
}) {
  const [trail, setTrail] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<{
    turn: string;
    what: "text" | "markdown" | "sources";
  } | null>(null);
  const composer = useComposer(draft, {
    running: kind === "streaming",
    slash: slash
      ? { items: SLASH.filter((s) => s.cmd.startsWith(draft.trim() || "/")), active: 0 }
      : null,
  });
  const list: ChatTurnVM[] = kind === "empty" ? [] : turns(kind);
  return (
    <Screen
      area="adr"
      mobile={mobile}
      chat={
        <ChatDock
          title={kind === "empty" ? localized.text3 : localized.text4}
          continuation={kind === "empty" ? undefined : kind === "cut" ? "open" : "continued"}
          turns={list}
          composer={composer}
          suggestions={SUGGESTIONS}
          roleName="Developer"
          signedIn={!signedOut}
          hostError={noHost ? localized.text6 : null}
          mobile={mobile}
          trailOpen={trail}
          copied={copied}
          onToggleTrail={(id) => setTrail((t) => ({ ...t, [id]: !(t[id] ?? false) }))}
          onCopy={(turn, what) => setCopied({ turn, what })}
        />
      }
    >
      <Behind mobile={mobile} />
    </Screen>
  );
}

function Full({
  mobile,
  renaming,
  menu,
  rich = true,
}: {
  mobile?: boolean;
  renaming?: boolean;
  menu?: boolean;
  rich?: boolean;
}) {
  const [sessions, setSessions] = useState(sessionsVM());
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(sessions[1].id);
  const [menuFor, setMenuFor] = useState<string | null>(menu ? sessions[1].id : null);
  const [ren, setRen] = useState<{ id: string; value: string; error?: string } | null>(
    renaming ? { id: sessions[1].id, value: localized.text7 } : null,
  );
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<{
    turn: string;
    what: "text" | "markdown" | "sources";
  } | null>(null);
  const composer = useComposer();
  const shown = sessions.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <Screen
      area={"ask"}
      mobile={mobile}
      chat={
        <ChatFull
          title={sessions.find((s) => s.id === current)?.title ?? ""}
          continuation="continued"
          turns={turns(rich ? "rich" : "answer")}
          composer={composer}
          sessions={shown}
          currentId={current}
          query={query}
          renaming={ren}
          menuFor={menuFor}
          sessionsOpen={open}
          mobile={mobile}
          copied={copied}
          onCopy={(turn, what) => setCopied({ turn, what })}
          onQuery={setQuery}
          onPick={(id) => {
            setCurrent(id);
            setOpen(false);
          }}
          onMenu={setMenuFor}
          onSessions={() => setOpen((o) => !o)}
          onPin={(id) => {
            setSessions((l) => l.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)));
            setMenuFor(null);
          }}
          onDelete={(id) => {
            setSessions((l) => l.filter((s) => s.id !== id));
            setMenuFor(null);
          }}
          onRename={(id) => {
            setRen({ id, value: sessions.find((s) => s.id === id)?.title ?? "" });
            setMenuFor(null);
          }}
          onRenameValue={(v) =>
            setRen((r) =>
              r
                ? {
                    ...r,
                    value: v,
                    error: v.trim() ? undefined : localized.text9,
                  }
                : r,
            )
          }
          onRenameSave={() => {
            setSessions((l) => l.map((s) => (s.id === ren?.id ? { ...s, title: ren.value } : s)));
            setRen(null);
          }}
          onRenameCancel={() => setRen(null)}
        />
      }
    >
      <Behind mobile={mobile} />
    </Screen>
  );
}

export const CompactChat: Story = { ...desktop, render: () => <Pill /> };
export const PillMobile: Story = { name: "Pill Mobile", ...mobile, render: () => <Pill mobile /> };
export const PillRunning: Story = {
  name: "Pill Running",
  ...desktop,
  render: () => <Pill running />,
};
export const PillRunningMobile: Story = {
  name: "Pill Running Mobile",
  ...mobile,
  render: () => <Pill mobile running />,
};
export const DockEmpty: Story = {
  name: "Dock Empty",
  ...desktop,
  render: () => <Dock kind="empty" />,
};
export const DockEmptyMobile: Story = {
  name: "Dock Empty Mobile",
  ...mobile,
  render: () => <Dock mobile kind="empty" />,
};
export const DockAnswer: Story = {
  ...desktop,
  render: () => <Dock kind="answer" />,
};
export const DockAnswerMobile: Story = {
  name: "Dock Answer Mobile",
  ...mobile,
  render: () => <Dock mobile kind="answer" />,
};
export const DockRunning: Story = {
  name: "Dock Running",
  ...desktop,
  render: () => <Dock kind="streaming" />,
};
export const DockRunningMobile: Story = {
  name: "Dock Running Mobile",
  ...mobile,
  render: () => <Dock mobile kind="streaming" />,
};
export const FullScreenWithSessions: Story = {
  name: "Full Screen With Sessions",
  ...desktop,
  render: () => <Full rich={false} />,
};
export const FullScreenWithSessionsMobile: Story = {
  name: "Full Screen With Sessions Mobile",
  ...mobile,
  render: () => <Full mobile rich={false} />,
};
export const SessionMenu: Story = {
  name: "Session Menu",
  ...desktop,
  render: () => <Full menu rich={false} />,
};
export const SessionMenuMobile: Story = {
  name: "Session Menu Mobile",
  ...mobile,
  render: () => <Full mobile menu rich={false} />,
};
export const RenameSession: Story = {
  name: "Rename Session",
  ...desktop,
  render: () => <Full renaming rich={false} />,
};
export const RenameSessionMobile: Story = {
  name: "Rename Session Mobile",
  ...mobile,
  render: () => <Full mobile renaming rich={false} />,
};
export const AnswerWithCodeAndTable: Story = {
  name: "Answer With Code And Table",
  ...desktop,
  render: () => <Full />,
};
export const AnswerWithCodeAndTableMobile: Story = {
  name: "Answer With Code And Table Mobile",
  ...mobile,
  render: () => <Full mobile />,
};
export const HalfAnswer: Story = {
  name: "Half Answer",
  ...desktop,
  render: () => <Dock kind="cut" />,
};
export const HalfAnswerMobile: Story = {
  name: "Half Answer Mobile",
  ...mobile,
  render: () => <Dock mobile kind="cut" />,
};
export const Stopped: Story = {
  name: "Stopped",
  ...desktop,
  render: () => <Dock kind="stopped" />,
};
export const StoppedMobile: Story = {
  name: "Stopped Mobile",
  ...mobile,
  render: () => <Dock mobile kind="stopped" />,
};
export const NotSignedIn: Story = {
  name: "Not Signed In",
  ...desktop,
  render: () => <Dock kind="empty" signedOut />,
};
export const NotSignedInMobile: Story = {
  name: "Not Signed In Mobile",
  ...mobile,
  render: () => <Dock mobile kind="empty" signedOut />,
};
export const Error: Story = { ...desktop, render: () => <Dock kind="failed" /> };
export const ErrorMobile: Story = {
  name: "Error Mobile",
  ...mobile,
  render: () => <Dock mobile kind="failed" />,
};
export const SlashCommands: Story = {
  name: "Slash Commands",
  ...desktop,
  render: () => <Dock kind="answer" slash draft="/" />,
};
export const SlashCommandsMobile: Story = {
  name: "Slash Commands Mobile",
  ...mobile,
  render: () => <Dock mobile kind="answer" slash draft="/" />,
};
export const HostWithoutAi: Story = {
  name: "Host Without Ai",
  ...desktop,
  render: () => <Dock kind="empty" noHost />,
};
export const HostWithoutAiMobile: Story = {
  name: "Host Without Ai Mobile",
  ...mobile,
  render: () => <Dock mobile kind="empty" noHost />,
};
export const FullScreenTablet: Story = {
  name: "Full Screen Tablet",
  ...tablet,
  render: () => <Full rich={false} />,
};
