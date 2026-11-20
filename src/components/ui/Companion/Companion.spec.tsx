import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompanionWithLogic, { Companion, type CompanionEntry } from ".";
import type { CompanionPlan } from "../../../core";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const plan: CompanionPlan = {
  text: "Two promises without a test.\n\nOpen: two promises without a test.",
  facts: [
    { label: "TEST MAPPED", value: "3/5", meaning: "neutral" },
    { label: "WITHOUT TEST", value: "2", meaning: "signal" },
  ],
  reads: ["docs/facets/a.yaml", "src/a.ts"],
  sources: [
    { text: "docs/facets/a.yaml", recordId: "a/b/c" },
    { text: "src/a.ts:12", recordId: null },
  ],
  openId: "a/b/c",
  section: "promises",
  follow: ["Who is responsible?"],
};

const entries: CompanionEntry[] = [
  { kind: "ask", id: "1", text: "What is the state of a?" },
  { kind: "answer", id: "2", plan },
];

const base = {
  scope: "sees: 8 records · src · 21,581 lines\nrole OPERATIONS",
  intro: "I have read the records.",
  foot: "answers from the records it has read",
  suggestions: [],
  draft: "",
  busy: false,
  onDraft: jest.fn(),
  onSend: jest.fn(),
  onClear: jest.fn(),
  onClose: jest.fn(),
  onAsk: jest.fn(),
  onOpenRecord: jest.fn(),
  onOpenSection: jest.fn(),
};

describe("Unit tests for withCompanionLogic", () => {
  it("shows the opening sentence as long as nothing has been asked", () => {
    render(<CompanionWithLogic {...base} entries={[]} />);
    expect(screen.getByText("I have read the records.")).toBeInTheDocument();
  });

  it("drops the opening sentence as soon as something is there", () => {
    render(<CompanionWithLogic {...base} entries={entries} />);
    expect(screen.queryByText("I have read the records.")).not.toBeInTheDocument();
  });

  it("renders question and answer as separate entries", () => {
    const { container } = render(<CompanionWithLogic {...base} entries={entries} />);
    expect(container.querySelectorAll("[data-message='question']")).toHaveLength(1);
    expect(container.querySelectorAll("[data-message='answer']")).toHaveLength(1);
  });

  it("names, for each answer, what was read", () => {
    render(<CompanionWithLogic {...base} entries={entries} />);
    expect(screen.getByText("READ")).toBeInTheDocument();
    expect(screen.getByText("docs/facets/a.yaml")).toBeInTheDocument();
    expect(screen.getByText("src/a.ts:12")).toBeInTheDocument();
  });

  it("jumps from a read location into the record", async () => {
    const onOpenRecord = jest.fn();
    render(<CompanionWithLogic {...base} entries={entries} onOpenRecord={onOpenRecord} />);
    await userEvent.click(screen.getByRole("button", { name: "Record" }));
    expect(onOpenRecord).toHaveBeenCalledWith("a/b/c");
  });

  it("offers no jump where the location is not a record", () => {
    render(<CompanionWithLogic {...base} entries={entries} />);
    // Exactly one source carries an id, the other is a code location.
    expect(screen.getAllByRole("button", { name: "Record" })).toHaveLength(1);
  });

  it("leads into the register section of the answer", async () => {
    const onOpenSection = jest.fn();
    render(<CompanionWithLogic {...base} entries={entries} onOpenSection={onOpenSection} />);
    await userEvent.click(screen.getByRole("button", { name: "IN THE REGISTER ↑" }));
    expect(onOpenSection).toHaveBeenCalledWith("promises");
  });

  it("passes a follow-up question on", async () => {
    const onAsk = jest.fn();
    render(<CompanionWithLogic {...base} entries={entries} onAsk={onAsk} />);
    await userEvent.click(screen.getByRole("button", { name: "Who is responsible?" }));
    expect(onAsk).toHaveBeenCalledWith("Who is responsible?");
  });

  it("shows every file that comes up while reading", () => {
    render(
      <CompanionWithLogic
        {...base}
        entries={entries}
        busy
        reads={["docs/facets/a.yaml", "src/a.ts"]}
      />,
    );
    expect(screen.getByText("READING")).toBeInTheDocument();
    expect(screen.getByText("src/a.ts")).toBeInTheDocument();
  });

  it("holds suggestions back while reading", () => {
    render(
      <CompanionWithLogic
        {...base}
        entries={[]}
        busy
        reads={["a"]}
        suggestions={[{ key: "s", text: "Where to start?", onAsk: jest.fn() }]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Where to start?" })).not.toBeInTheDocument();
  });

  it("offers “clear” only when there is something to clear", () => {
    const { rerender } = render(<CompanionWithLogic {...base} entries={[]} />);
    expect(screen.queryByRole("button", { name: "clear" })).not.toBeInTheDocument();
    rerender(<CompanionWithLogic {...base} entries={entries} />);
    expect(screen.getByRole("button", { name: "clear" })).toBeInTheDocument();
  });

  it("sends the question on submit", async () => {
    const onSend = jest.fn();
    render(<CompanionWithLogic {...base} entries={[]} draft="What is open?" onSend={onSend} />);
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(onSend).toHaveBeenCalled();
  });

  it("says below the field what is behind it", () => {
    render(<CompanionWithLogic {...base} entries={[]} />);
    expect(screen.getByText("answers from the records it has read")).toBeInTheDocument();
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German in the header, the answer and the composer under the German locale", () => {
    renderInGerman(<CompanionWithLogic {...base} entries={entries} />);
    expect(
      screen.getByRole("button", { name: germanText.t("elements.companion.clear") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: germanText.t("elements.companion.close") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: germanText.t("shell.tab.ask") })).toBeInTheDocument();
    expect(screen.getByText(germanText.t("core.companion.fact.read"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: germanText.t("elements.companion.openDetail") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: germanText.t("elements.companion.inRegister") }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(germanText.t("elements.companion.placeholder")),
    ).toBeInTheDocument();
  });

  it("speaks German while it is working under the German locale", () => {
    renderInGerman(
      <CompanionWithLogic
        {...base}
        entries={entries}
        busy
        reads={["src/a.ts"]}
        onStop={jest.fn()}
      />,
    );
    expect(screen.getByText(germanText.t("elements.companion.working"))).toBeInTheDocument();
    expect(screen.getByText(germanText.t("elements.companion.reading"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: germanText.t("elements.companion.stop") }),
    ).toBeInTheDocument();
  });
});

describe("Unit tests for Companion", () => {
  it("names itself so the column stays findable", () => {
    render(<CompanionWithLogic {...base} entries={[]} />);
    const panel = screen.getByRole("complementary", { name: "Companion" });
    expect(within(panel).getByText("Companion")).toBeInTheDocument();
  });

  it("accepts the plain version without entries", () => {
    render(
      <Companion
        containerStyle={{}}
        headStyle={{}}
        headRowStyle={{}}
        markStyle={{}}
        titleStyle={{}}
        actionStyle={{}}
        scopeStyle={{}}
        scrollStyle={{}}
        introStyle={{}}
        messageStyle={{}}
        askStyle={{}}
        answerStyle={{}}
        factsStyle={{}}
        factLabelStyle={{}}
        readsHeadStyle={{}}
        sourceRowStyle={{}}
        sourceStyle={{}}
        sourceOpenStyle={{}}
        jumpRowStyle={{}}
        jumpStyle={{}}
        sectionJumpStyle={{}}
        followListStyle={{}}
        followStyle={{}}
        busyStyle={{}}
        stopStyle={{}}
        readStyle={() => ({})}
        suggestListStyle={{}}
        suggestStyle={{}}
        composerStyle={{}}
        inputRowStyle={{}}
        inputStyle={{}}
        sendStyle={{}}
        footStyle={{}}
        title="Companion"
        scope=""
        clearLabel=""
        onClear={jest.fn()}
        onClose={jest.fn()}
        intro="nothing asked yet"
        showIntro
        messages={[]}
        reads={[]}
        busy={false}
        suggestions={[]}
        draft=""
        onDraft={jest.fn()}
        onSend={jest.fn()}
        placeholder="Question"
        sendLabel="Ask"
        foot=""
      />,
    );
    expect(screen.getByText("nothing asked yet")).toBeInTheDocument();
  });
});

describe("Unit tests for the height limit of the chat", () => {
  // Since `41d1bfe` the companion no longer grows without bound: the page
  // around it sets 'height: 100vh; overflow: hidden' instead of only
  // 'minHeight', and this column resolves its own overflow with
  // 'flex: 1; minHeight: 0; overflowY: auto' on the message log.
  // This test pins the second half: even with many long messages the line
  // stays, instead of silently disappearing in the next rework.
  it("keeps 'overflowY: auto' and 'minHeight: 0' on the message log, even with many long entries", () => {
    const longEntries: CompanionEntry[] = Array.from({ length: 40 }, (_, index) => {
      const askEntry: CompanionEntry = {
        kind: "ask",
        id: `f${index}`,
        text: `Question number ${index}: ${"a very long question text without a break point ".repeat(4)}`,
      };
      const answerEntry: CompanionEntry = {
        kind: "answer",
        id: `a${index}`,
        plan: {
          ...plan,
          text: `Answer number ${index}.\n\n${"A long paragraph with many sentences. ".repeat(12)}`,
        },
      };
      return index % 2 === 0 ? askEntry : answerEntry;
    });

    const { container } = render(<CompanionWithLogic {...base} entries={longEntries} />);

    const log = container.querySelector("[data-companion-log]");
    expect(log).not.toBeNull();
    expect(log).toHaveStyle({ minHeight: "0", overflowY: "auto" });
  });
});

describe("Unit tests for what the agent does in the background", () => {
  it("shows the tools with their target while it works", () => {
    render(
      <CompanionWithLogic
        {...base}
        entries={entries}
        busy
        reads={["src/reader.ts"]}
        activity={[
          { key: "t0", tool: "Grep", target: "readOnlyTools" },
          { key: "t1", tool: "Read", target: "src/reader.ts" },
        ]}
      />,
    );

    expect(screen.getByText("TOOLS")).toBeInTheDocument();
    expect(screen.getByText("Read · src/reader.ts")).toBeInTheDocument();
  });

  it("shows the thinking with counted tokens and expands it", async () => {
    const onThinkingToggle = jest.fn();
    render(
      <CompanionWithLogic
        {...base}
        entries={entries}
        busy
        reads={[]}
        thinking="First find the file, then read the constant."
        thinkingTokens={42}
        thinkingOpen={false}
        onThinkingToggle={onThinkingToggle}
      />,
    );

    const toggle = screen.getByRole("button", { name: /THINKING/ });
    expect(toggle).toHaveTextContent("42");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(onThinkingToggle).toHaveBeenCalled();
  });

  // A notice without a way out leaves the reader at a loss, so it carries the
  // command that fixes it.
  it("says what to do when the login is missing", () => {
    render(
      <CompanionWithLogic
        {...base}
        entries={[]}
        notice={{
          text: "Nobody is signed in to Claude Code.",
          hint: "Sign in from a terminal: `claude auth login`.",
        }}
      />,
    );

    expect(screen.getByText("NOT READY")).toBeInTheDocument();
    expect(screen.getByText(/claude auth login/)).toBeInTheDocument();
  });

  it("offers the models to choose from and reports the choice", async () => {
    const onModel = jest.fn();
    render(
      <CompanionWithLogic
        {...base}
        entries={[]}
        models={[
          { id: "", label: "Default" },
          { id: "haiku", label: "Haiku", note: "economical" },
        ]}
        model=""
        onModel={onModel}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Model"), "haiku");
    expect(onModel).toHaveBeenCalledWith("haiku");
  });

  it("switches to full screen and says which state it is in", async () => {
    const onFullscreen = jest.fn();
    render(
      <CompanionWithLogic {...base} entries={[]} fullscreen={false} onFullscreen={onFullscreen} />,
    );

    const button = screen.getByRole("button", { name: "fullscreen" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(onFullscreen).toHaveBeenCalled();
  });

  it("names the way back when it is already in full screen", () => {
    render(<CompanionWithLogic {...base} entries={[]} fullscreen onFullscreen={jest.fn()} />);

    expect(screen.getByRole("button", { name: "shrink" })).toHaveAttribute("aria-pressed", "true");
  });
});
