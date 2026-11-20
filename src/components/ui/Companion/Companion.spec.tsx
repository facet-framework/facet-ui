import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Companion/Companion.spec.text";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompanionWithLogic, { Companion, type CompanionEntry } from ".";
import type { CompanionPlan } from "../../../core";

const plan: CompanionPlan = {
  text: localized.text1,
  facts: [
    { label: "TEST ZUGEORDNET", value: "3/5", meaning: "neutral" },
    { label: localized.text2, value: "2", meaning: "signal" },
  ],
  reads: ["docs/facets/a.yaml", "src/a.ts"],
  sources: [
    { text: "docs/facets/a.yaml", recordId: "a/b/c" },
    { text: "src/a.ts:12", recordId: null },
  ],
  openId: "a/b/c",
  section: "promises",
  follow: [localized.text3],
};

const entries: CompanionEntry[] = [
  { kind: "ask", id: "1", text: labelText.text322 },
  { kind: "answer", id: "2", plan },
];

const base = {
  scope: remainingText.text153,
  intro: localized.text4,
  foot: germanLabels.text169,
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
  it("shows the opening sentence before a question", () => {
    render(<CompanionWithLogic {...base} entries={[]} />);
    expect(screen.getByText(localized.text6)).toBeInTheDocument();
  });

  it("hides the opening sentence once messages exist", () => {
    render(<CompanionWithLogic {...base} entries={entries} />);
    expect(screen.queryByText(localized.text8)).not.toBeInTheDocument();
  });

  it("renders the question and answer as separate messages", () => {
    const { container } = render(<CompanionWithLogic {...base} entries={entries} />);
    expect(container.querySelectorAll("[data-message='question']")).toHaveLength(1);
    expect(container.querySelectorAll("[data-message='answer']")).toHaveLength(1);
  });

  it("names the sources read for each answer", () => {
    render(<CompanionWithLogic {...base} entries={entries} />);
    expect(screen.getByText("GELESEN")).toBeInTheDocument();
    expect(screen.getByText("docs/facets/a.yaml")).toBeInTheDocument();
    expect(screen.getByText("src/a.ts:12")).toBeInTheDocument();
  });

  it("opens the record from a cited passage", async () => {
    const onOpenRecord = jest.fn();
    render(<CompanionWithLogic {...base} entries={entries} onOpenRecord={onOpenRecord} />);
    await userEvent.click(screen.getByRole("button", { name: "Record" }));
    expect(onOpenRecord).toHaveBeenCalledWith("a/b/c");
  });

  it("offers no record navigation for other sources", () => {
    render(<CompanionWithLogic {...base} entries={entries} />);

    expect(screen.getAllByRole("button", { name: "Record" })).toHaveLength(1);
  });

  it("opens the answer's register section", async () => {
    const onOpenSection = jest.fn();
    render(<CompanionWithLogic {...base} entries={entries} onOpenSection={onOpenSection} />);
    await userEvent.click(screen.getByRole("button", { name: localized.text13 }));
    expect(onOpenSection).toHaveBeenCalledWith("promises");
  });

  it("forwards a follow-up question", async () => {
    const onAsk = jest.fn();
    render(<CompanionWithLogic {...base} entries={entries} onAsk={onAsk} />);
    await userEvent.click(screen.getByRole("button", { name: localized.text15 }));
    expect(onAsk).toHaveBeenCalledWith(localized.text16);
  });

  it("shows each file as it is read", () => {
    render(
      <CompanionWithLogic
        {...base}
        entries={entries}
        busy
        reads={["docs/facets/a.yaml", "src/a.ts"]}
      />,
    );
    expect(screen.getByText(localized.text18)).toBeInTheDocument();
    expect(screen.getByText("src/a.ts")).toBeInTheDocument();
  });

  it("withholds suggestions while reading", () => {
    render(
      <CompanionWithLogic
        {...base}
        entries={[]}
        busy
        reads={["a"]}
        suggestions={[{ key: "s", text: labelText.text323, onAsk: jest.fn() }]}
      />,
    );
    expect(screen.queryByRole("button", { name: labelText.text323 })).not.toBeInTheDocument();
  });

  it("offers clearing only when content exists", () => {
    const { rerender } = render(<CompanionWithLogic {...base} entries={[]} />);
    expect(screen.queryByRole("button", { name: remainingText.text151 })).not.toBeInTheDocument();
    rerender(<CompanionWithLogic {...base} entries={entries} />);
    expect(screen.getByRole("button", { name: remainingText.text151 })).toBeInTheDocument();
  });

  it("sends the question on submission", async () => {
    const onSend = jest.fn();
    render(<CompanionWithLogic {...base} entries={[]} draft={localized.text22} onSend={onSend} />);
    await userEvent.click(screen.getByRole("button", { name: localized.text23 }));
    expect(onSend).toHaveBeenCalled();
  });

  it("explains the field's purpose below it", () => {
    render(<CompanionWithLogic {...base} entries={[]} />);
    expect(screen.getByText(germanLabels.text169)).toBeInTheDocument();
  });
});

describe("Unit tests for Companion", () => {
  it("names the column for discovery", () => {
    render(<CompanionWithLogic {...base} entries={[]} />);
    const panel = screen.getByRole("complementary", { name: "Companion" });
    expect(within(panel).getByText("Companion")).toBeInTheDocument();
  });

  it("accepts an empty conversation", () => {
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
        intro="nichts gefragt"
        showIntro
        messages={[]}
        reads={[]}
        busy={false}
        suggestions={[]}
        draft=""
        onDraft={jest.fn()}
        onSend={jest.fn()}
        placeholder={germanLabels.text48}
        sendLabel={localized.text27}
        foot=""
      />,
    );
    expect(screen.getByText("nichts gefragt")).toBeInTheDocument();
  });
});

describe("chat height limits", () => {
  it("preserves scrolling and zero minimum height with many long messages", () => {
    const longEntries: CompanionEntry[] = Array.from({ length: 40 }, (_, index) => {
      const askEntry: CompanionEntry = {
        kind: "ask",
        id: `f${index}`,
        text: `${germanLabels.text170}${index}: ${localized.text30.repeat(4)}`,
      };
      const answerEntry: CompanionEntry = {
        kind: "answer",
        id: `a${index}`,
        plan: {
          ...plan,
          text: `${remainingText.text154}${index}.\n\n${localized.text31.repeat(12)}`,
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

describe("background agent activity", () => {
  it("shows active tools and their targets", () => {
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

    expect(screen.getByText(labelText.text321)).toBeInTheDocument();
    expect(screen.getByText("Read · src/reader.ts")).toBeInTheDocument();
  });

  it("shows expandable reasoning and its token count", async () => {
    const onThinkingToggle = jest.fn();
    render(
      <CompanionWithLogic
        {...base}
        entries={entries}
        busy
        reads={[]}
        thinking={localized.text35}
        thinkingTokens={42}
        thinkingOpen={false}
        onThinkingToggle={onThinkingToggle}
      />,
    );

    const toggle = screen.getByRole("button", { name: /DENKT/ });
    expect(toggle).toHaveTextContent("42");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(onThinkingToggle).toHaveBeenCalled();
  });

  it("explains how to sign in", () => {
    render(
      <CompanionWithLogic
        {...base}
        entries={[]}
        notice={{
          text: localized.text37,
          hint: localized.text38,
        }}
      />,
    );

    expect(screen.getByText(localized.text39)).toBeInTheDocument();
    expect(screen.getByText(/claude auth login/)).toBeInTheDocument();
  });

  it("lists models and reports selection", async () => {
    const onModel = jest.fn();
    render(
      <CompanionWithLogic
        {...base}
        entries={[]}
        models={[
          { id: "", label: labelText.text122 },
          { id: "haiku", label: "Haiku", note: labelText.text324 },
        ]}
        model=""
        onModel={onModel}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText(germanLabels.text36), "haiku");
    expect(onModel).toHaveBeenCalledWith("haiku");
  });

  it("opens full screen and labels its state", async () => {
    const onFullscreen = jest.fn();
    render(
      <CompanionWithLogic {...base} entries={[]} fullscreen={false} onFullscreen={onFullscreen} />,
    );

    const button = screen.getByRole("button", { name: labelText.text318 });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(onFullscreen).toHaveBeenCalled();
  });

  it("names the return action in full screen", () => {
    render(<CompanionWithLogic {...base} entries={[]} fullscreen onFullscreen={jest.fn()} />);

    expect(screen.getByRole("button", { name: labelText.text317 })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
