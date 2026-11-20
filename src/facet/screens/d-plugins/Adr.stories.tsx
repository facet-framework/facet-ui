import { localized } from "../../../i18n/legacy/facet/screens/d-plugins/Adr.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import {
  AdrCollection,
  AdrDirectorySetting,
  AdrEmpty,
  AdrNewForm,
  AdrReader,
  AdrStatusForm,
  type AdrSortKey,
  type AdrStatus,
  type AdrView,
} from "./Adr";
import { adrChain, adrCounts, adrDetail, adrs480, sortAdrs } from "./storyData";

const meta: Meta = { title: "Screens/D Plugins/Decisions" };
export default meta;
type Story = StoryObj;

const COUNTS = adrCounts(adrs480);

function List({
  mobile,
  initial,
  startPage = 1,
  loading,
  createDisabledReason,
}: {
  mobile?: boolean;
  initial: AdrView;
  startPage?: number;
  loading?: boolean;
  createDisabledReason?: string;
}) {
  const [view, setView] = useState<AdrView>(initial);
  const [sort, setSort] = useState<{ key: AdrSortKey; dir: "asc" | "desc" }>({
    key: "number",
    dir: "desc",
  });
  const [page, setPage] = useState(startPage);
  const [size, setSize] = useState(60);
  const [status, setStatus] = useState<AdrStatus | null>(null);
  const [query, setQuery] = useState("");
  const filtered = sortAdrs(adrs480, sort.key, sort.dir).filter(
    (a) =>
      (!status || a.status === status) &&
      (!query || a.title.toLowerCase().includes(query.toLowerCase())),
  );
  const items = view === "board" ? filtered : filtered.slice((page - 1) * size, page * size);
  return (
    <Screen area="adr" mobile={mobile}>
      <AdrCollection
        state={loading ? "loading" : filtered.length ? "ready" : "filtered-empty"}
        view={view}
        items={items}
        total={adrs480.length}
        counts={COUNTS}
        page={page}
        pageSize={size}
        query={query}
        activeStatus={status}
        directory="docs/adr"
        sort={sort}
        mobile={mobile}
        createDisabledReason={createDisabledReason}
        onSort={(key) =>
          setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))
        }
        onView={setView}
        onPage={setPage}
        onPageSize={setSize}
        onQuery={setQuery}
        onStatus={(s) => setStatus((c) => (c === s ? null : (s as AdrStatus)))}
        onReset={() => {
          setStatus(null);
          setQuery("");
        }}
      />
    </Screen>
  );
}

const D = adrDetail(1);
const CHAIN = adrChain(3);

const Reader = ({
  mobile,
  form,
  unreadable,
  unknown,
  chain,
}: {
  mobile?: boolean;
  form?: boolean;
  unreadable?: boolean;
  unknown?: boolean;
  chain?: boolean;
}) => {
  const [next, setNext] = useState<AdrStatus>("superseded");
  const [reason, setReason] = useState<string>(localized.text2);
  return (
    <Screen
      area="adr"
      mobile={mobile}
      overlay={
        form ? (
          <AdrStatusForm
            adr={D.adr}
            next={next}
            reason={reason}
            reasonError={reason.trim().length < 20 ? localized.text3 : undefined}
            successor={6}
            successors={[{ number: 6, title: localized.text4 }]}
            branch="adr/0002-status-superseded"
            diff={`- Status: ${D.adr.rawStatus}\n+ Status: ${next}\n+ Ersetzt durch: 0006`}
            mobile={mobile}
            onNext={setNext}
            onChange={(f, v) => (f === "reason" ? setReason(v) : undefined)}
          />
        ) : undefined
      }
    >
      <AdrReader
        {...D}
        adr={
          unknown
            ? { ...D.adr, status: "unknown", rawStatus: "in Abstimmung (Q4)" }
            : chain
              ? {
                  ...D.adr,
                  status: "superseded",
                  rawStatus: `${localized.text6}${String(CHAIN[2].number).padStart(4, "0")}`,
                  supersededBy: { number: CHAIN[2].number, title: CHAIN[2].title },
                }
              : D.adr
        }
        chain={chain ? CHAIN : undefined}
        readable={!unreadable}
        mobile={mobile}
      />
    </Screen>
  );
};

function NewForm({ mobile }: { mobile?: boolean }) {
  const [v, setV] = useState({
    title: localized.text7,
    context: localized.text8,
    decision: localized.text9,
    consequences: "",
  });
  return (
    <Screen area="adr" mobile={mobile}>
      <AdrNewForm
        number={481}
        {...v}
        titleError={v.title.trim() ? undefined : localized.text10}
        records={["workspace/board/column"]}
        file={localized.text11}
        mobile={mobile}
        onChange={(f, val) => setV((o) => ({ ...o, [f]: val }))}
      />
    </Screen>
  );
}

function Directory({ mobile }: { mobile?: boolean }) {
  const [dir, setDir] = useState("docs/adr");
  return (
    <Screen area="adr" mobile={mobile}>
      <AdrDirectorySetting
        directory={dir}
        error={dir.startsWith("/") ? localized.text12 : undefined}
        found={dir === "docs/decisions" ? 0 : 6}
        sample={
          dir === "docs/decisions"
            ? []
            : [
                "docs/adr/0001-offline-first-storage.md",
                "docs/adr/0002-sync-conflicts.md",
                "docs/adr/0003-notification-channels.md",
              ]
        }
        ignored={
          dir === "docs/decisions" ? [] : [{ file: "docs/adr/README.md", reason: localized.text13 }]
        }
        onChange={setDir}
      />
    </Screen>
  );
}

const Empty = ({ mobile, reason }: { mobile?: boolean; reason?: string }) => (
  <Screen area="adr" mobile={mobile}>
    <AdrEmpty directory="docs/adr" createDisabledReason={reason} />
  </Screen>
);

const READ_ONLY = "Read-only checkout: decisions are created in a writable clone.";

export const Timeline: Story = {
  ...desktop,
  render: () => <List initial="timeline" />,
};
export const TimelineMobile: Story = {
  name: "Timeline Mobile",
  ...mobile,
  render: () => <List mobile initial="timeline" />,
};
export const Board: Story = { ...desktop, render: () => <List initial="board" /> };
export const BoardMobile: Story = {
  name: "Board Mobile",
  ...mobile,
  render: () => <List mobile initial="board" />,
};
export const TablePage2: Story = {
  name: "Table Page2",
  ...desktop,
  render: () => <List initial="table" startPage={2} />,
};
export const TablePage2Mobile: Story = {
  name: "Table Page2 Mobile",
  ...mobile,
  render: () => <List mobile initial="table" startPage={2} />,
};
export const Loading: Story = {
  name: "Loading",
  ...desktop,
  render: () => <List initial="timeline" loading />,
};
export const LoadingMobile: Story = {
  name: "Loading Mobile",
  ...mobile,
  render: () => <List mobile initial="timeline" loading />,
};
export const DecisionReader: Story = { ...desktop, render: () => <Reader /> };
export const ReaderMobile: Story = {
  name: "Reader Mobile",
  ...mobile,
  render: () => <Reader mobile />,
};
export const FileNotReadable: Story = {
  name: "File Not Readable",
  ...desktop,
  render: () => <Reader unreadable />,
};
export const FileNotReadableMobile: Story = {
  name: "File Not Readable Mobile",
  ...mobile,
  render: () => <Reader mobile unreadable />,
};
export const ProposeStatus: Story = {
  name: "Propose Status",
  ...desktop,
  render: () => <Reader form />,
};
export const ProposeStatusMobile: Story = {
  name: "Propose Status Mobile",
  ...mobile,
  render: () => <Reader mobile form />,
};
export const NewDecision: Story = {
  ...desktop,
  render: () => <NewForm />,
};
export const NewDecisionMobile: Story = {
  name: "New Decision Mobile",
  ...mobile,
  render: () => <NewForm mobile />,
};
export const NoAdrs: Story = { name: "No Adrs", ...desktop, render: () => <Empty /> };
export const NoAdrsMobile: Story = {
  name: "No Adrs Mobile",
  ...mobile,
  render: () => <Empty mobile />,
};
export const ConfigureDirectory: Story = {
  name: "Configure Directory",
  ...desktop,
  render: () => <Directory />,
};
export const ConfigureDirectoryMobile: Story = {
  name: "Configure Directory Mobile",
  ...mobile,
  render: () => <Directory mobile />,
};
export const StatusUnknown: Story = {
  name: "Status Unknown",
  ...desktop,
  render: () => <Reader unknown />,
};
export const StatusUnknownMobile: Story = {
  name: "Status Unknown Mobile",
  ...mobile,
  render: () => <Reader mobile unknown />,
};
export const SupersessionChain: Story = {
  name: "Supersession Chain",
  ...desktop,
  render: () => <Reader chain />,
};
export const SupersessionChainMobile: Story = {
  name: "Supersession Chain Mobile",
  ...mobile,
  render: () => <Reader mobile chain />,
};
export const CreateDisabled: Story = {
  name: "Create Disabled",
  ...desktop,
  render: () => <List initial="timeline" createDisabledReason={READ_ONLY} />,
};
export const CreateDisabledMobile: Story = {
  name: "Create Disabled Mobile",
  ...mobile,
  render: () => <List mobile initial="timeline" createDisabledReason={READ_ONLY} />,
};
export const NoAdrsDisabled: Story = {
  name: "No Adrs Disabled",
  ...desktop,
  render: () => <Empty reason={READ_ONLY} />,
};
export const NoAdrsDisabledMobile: Story = {
  name: "No Adrs Disabled Mobile",
  ...mobile,
  render: () => <Empty mobile reason={READ_ONLY} />,
};
