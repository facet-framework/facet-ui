import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/KnowledgeSlots/KnowledgeSlots.spec.text";
import { render, screen } from "@testing-library/react";
import KnowledgeSlotsWithLogic, { KnowledgeSlots, withKnowledgeSlotsLogic } from ".";

const slots = [
  {
    key: "edge_cases",
    question: localized.text1,
    answer: localized.text2,
    derive: [germanLabels.text158],
  },
  { key: "failure_modes", question: germanLabels.text159, answer: "" },
];

describe("Unit tests for KnowledgeSlots", () => {
  it("renders one row per slot with its question and answer", () => {
    const { container } = render(
      <KnowledgeSlots
        containerStyle={{}}
        captionStyle={{}}
        caption={germanLabels.text160}
        slots={[
          {
            key: "a",
            slot: "edge_cases",
            question: germanLabels.text53,
            answer: remainingText.text147,
            derivation: germanLabels.text158,
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
    expect(screen.getByText(germanLabels.text53)).toBeInTheDocument();
    expect(screen.getByText(remainingText.text147)).toBeInTheDocument();
  });
});

describe("Unit tests for withKnowledgeSlotsLogic", () => {
  it("shows the answer's derivation", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(screen.getByText(germanLabels.text158)).toBeInTheDocument();
  });

  it("reports when no derivation is provided", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(screen.getByText(localized.text6)).toBeInTheDocument();
  });

  it("combines multiple derivation sources without losing any", () => {
    render(<KnowledgeSlotsWithLogic slots={[{ key: "x", derive: ["anchors", "tests"] }]} />);
    expect(screen.getByText("anchors, tests")).toBeInTheDocument();
  });

  it("presents an open question as a statement", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    const offen = screen.getByText(localized.text9);

    expect(offen.closest("div")).toHaveStyle({ color: "var(--signal)" });
  });

  it("counts questions and open issues", () => {
    render(<KnowledgeSlotsWithLogic slots={slots} />);
    expect(screen.getByText(localized.text11)).toBeInTheDocument();
  });

  it("reports fully answered knowledge", () => {
    render(<KnowledgeSlotsWithLogic slots={[slots[0]]} />);
    expect(screen.getByText(localized.text13)).toBeInTheDocument();
  });

  it("filters to open questions", () => {
    const { container } = render(<KnowledgeSlotsWithLogic slots={slots} onlyOpen />);
    expect(container.querySelectorAll("[data-slot]")).toHaveLength(1);
  });

  it("reports when no knowledge is recorded", () => {
    render(<KnowledgeSlotsWithLogic slots={[]} />);
    expect(screen.getByText(localized.text16)).toBeInTheDocument();
  });

  it("names missing questions", () => {
    render(<KnowledgeSlotsWithLogic slots={[{ key: "x", question: "", answer: "" }]} />);
    expect(screen.getByText(localized.text18)).toBeInTheDocument();
  });

  it("renders answers as Markdown rather than raw text", () => {
    render(
      <KnowledgeSlotsWithLogic
        slots={[
          {
            key: "x",
            question: localized.text20,
            answer: localized.text21,
          },
        ]}
      />,
    );

    expect(screen.queryByText(/`tools\/forge\/dkim-rotate\.sh`/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\*\*root\*\*/)).not.toBeInTheDocument();
    expect(screen.getByText("tools/forge/dkim-rotate.sh")).toBeInTheDocument();
    expect(screen.getByText("root")).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withKnowledgeSlotsLogic(KnowledgeSlots).displayName).toBe(
      "withKnowledgeSlotsLogic(KnowledgeSlots)",
    );
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
