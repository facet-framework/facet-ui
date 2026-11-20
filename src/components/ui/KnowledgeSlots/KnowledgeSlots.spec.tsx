import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import KnowledgeSlotsWithLogic, { KnowledgeSlots, withKnowledgeSlotsLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const slots = [
  {
    key: "edge_cases",
    question: "What happens with duplicate entries?",
    answer: "The second entry is discarded.",
    derive: ["derived from the unit tests"],
  },
  { key: "failure_modes", question: "What happens on network loss?", answer: "" },
];

describe("Unit tests for KnowledgeSlots", () => {
  it("renders one row per slot with question and answer", () => {
    const { container } = render(
      <KnowledgeSlots
        containerStyle={{}}
        captionStyle={{}}
        caption="1 question"
        slots={[
          {
            key: "a",
            slot: "edge_cases",
            question: "Question?",
            answer: "Answer.",
            derivation: "derived from the unit tests",
            filled: true,
            rowStyle: {},
            slotStyle: {},
            questionStyle: {},
            answerStyle: {},
            derivationStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-slot]")).toHaveLength(1);
    expect(screen.getByText("Question?")).toBeInTheDocument();
    expect(screen.getByText("Answer.")).toBeInTheDocument();
  });
});

describe("Unit tests for withKnowledgeSlotsLogic", () => {
  it("shows how the answer was derived", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(screen.getByText("derived from the unit tests")).toBeInTheDocument();
  });

  it("says so when no derivation is given", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(screen.getByText("without derivation")).toBeInTheDocument();
  });

  it("combines several derivation sources instead of losing them", () => {
    // Render every derivation source from the list.
    render(<KnowledgeSlotsWithLogic slots={[{ key: "x", derive: ["anchors", "tests"] }]} />);
    expect(screen.getByText("anchors, tests")).toBeInTheDocument();
  });

  it("turns the open question into a statement", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    const open = screen.getByText("open — there is no answer to this yet");
    // The answer runs through <Markdown>; the colour sits on its container div,
    // not on the text node.
    expect(open.closest("div")).toHaveStyle({ color: "var(--signal)" });
  });

  it("counts questions and open points", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(screen.getByText("2 questions · 1 open.")).toBeInTheDocument();
  });

  it("reports fully answered knowledge", () => {
    render(<KnowledgeSlotsWithLogic slots={[slots[0]]} />);
    expect(screen.getByText("1 question, answered.")).toBeInTheDocument();
  });

  it("filters to open questions", () => {
    const { container } = render(<KnowledgeSlotsWithLogic slots={slots} onlyOpen />);
    expect(container.querySelectorAll("[data-slot]")).toHaveLength(1);
  });

  it("says so when no knowledge is recorded", () => {
    render(<KnowledgeSlotsWithLogic slots={[]} />);
    expect(screen.getByText("No knowledge recorded.")).toBeInTheDocument();
  });

  it("names missing questions", () => {
    render(<KnowledgeSlotsWithLogic slots={[{ key: "x", question: "", answer: "" }]} />);
    expect(screen.getByText("no question formulated")).toBeInTheDocument();
  });

  it("shows the answer as Markdown, not as raw text", () => {
    // Render Markdown answers as formatted content.
    render(
      <KnowledgeSlotsWithLogic
        slots={[
          {
            key: "x",
            question: "How is the rotation started?",
            answer: "With `tools/forge/dkim-rotate.sh` and **root** rights.",
          },
        ]}
      />,
    );

    expect(screen.queryByText(/`tools\/forge\/dkim-rotate\.sh`/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\*\*root\*\*/)).not.toBeInTheDocument();
    expect(screen.getByText("tools/forge/dkim-rotate.sh")).toBeInTheDocument();
    expect(screen.getByText("root")).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withKnowledgeSlotsLogic(KnowledgeSlots).displayName).toBe(
      "withKnowledgeSlotsLogic(KnowledgeSlots)",
    );
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(
      screen.getByText(
        germanText.t("elements.knowledgeSlots.someOpen.other", { count: "2", open: "1" }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(germanText.t("elements.knowledgeSlots.open"))).toBeInTheDocument();
  });
});

describe("Snapshot tests for KnowledgeSlots", () => {
  it("with an open question", () => {
    const { container } = render(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without knowledge", () => {
    const { container } = render(<KnowledgeSlotsWithLogic slots={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
