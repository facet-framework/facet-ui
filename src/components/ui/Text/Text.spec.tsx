import { render, screen } from "@testing-library/react";
import TextWithLogic, { Text, withTextLogic } from ".";

describe("Unit tests for Text", () => {
  it("renders children in a span when no element is given", () => {
    render(<Text computedStyle={{ color: "red" }}>Overview</Text>);
    expect(screen.getByText("Overview").tagName).toBe("SPAN");
  });

  it("renders the requested element", () => {
    render(
      <Text as="h2" computedStyle={{}}>
        Register
      </Text>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Register");
  });

  it("takes over the computed style unchanged", () => {
    render(<Text computedStyle={{ fontWeight: 500, color: "rgb(17, 19, 24)" }}>Value</Text>);
    expect(screen.getByText("Value")).toHaveStyle({ fontWeight: 500 });
  });

  it("passes further attributes through to the element", () => {
    render(
      <Text computedStyle={{}} title="Origin" data-testid="value">
        4
      </Text>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute("title", "Origin");
  });

  it("renders without children", () => {
    const { container } = render(<Text computedStyle={{}} data-testid="empty" />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});

describe("Unit tests for withTextLogic", () => {
  it("sets body text as the default variant", () => {
    render(<TextWithLogic>Default</TextWithLogic>);
    expect(screen.getByText("Default")).toHaveStyle({ fontFamily: "var(--font-sans)" });
  });

  it("switches to mono for field values", () => {
    render(<TextWithLogic mono>tasks/create/quick-add</TextWithLogic>);
    expect(screen.getByText("tasks/create/quick-add")).toHaveStyle({
      fontFamily: "var(--font-mono)",
    });
  });

  it("translates the tone into the semantic colour", () => {
    render(<TextWithLogic tone="due">due 2026-07-12</TextWithLogic>);
    expect(screen.getByText("due 2026-07-12")).toHaveStyle({ color: "var(--due)" });
  });

  it("truncates on one line instead of wrapping", () => {
    render(<TextWithLogic truncate>packages/core/src/lists/store.ts</TextWithLogic>);
    expect(screen.getByText("packages/core/src/lists/store.ts")).toHaveStyle({
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    });
  });

  it("limits descriptions to the given number of lines", () => {
    render(<TextWithLogic clamp={2}>Long description</TextWithLogic>);
    expect(screen.getByText("Long description")).toHaveStyle({ WebkitLineClamp: "2" });
  });

  it("lets own styles override the computed ones", () => {
    render(<TextWithLogic style={{ color: "rgb(0, 0, 0)" }}>Special case</TextWithLogic>);
    expect(screen.getByText("Special case")).toHaveStyle({ color: "rgb(0, 0, 0)" });
  });

  it("passes props through to the pure component", () => {
    render(
      <TextWithLogic as="p" id="lead-sentence" variant="hero">
        Lead sentence
      </TextWithLogic>,
    );
    const node = screen.getByText("Lead sentence");
    expect(node.tagName).toBe("P");
    expect(node).toHaveAttribute("id", "lead-sentence");
  });

  it("assigns a descriptive displayName", () => {
    expect(withTextLogic(Text).displayName).toBe("withTextLogic(Text)");
  });
});

describe("Snapshot tests for Text", () => {
  it("body text", () => {
    const { container } = render(<TextWithLogic>Body text</TextWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("lead sentence as hero", () => {
    const { container } = render(
      <TextWithLogic as="p" variant="hero">
        16 points need you
      </TextWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("factual label in capitals", () => {
    const { container } = render(
      <TextWithLogic variant="label" tone="dim">
        Entry points in code
      </TextWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("field value in mono, single line", () => {
    const { container } = render(
      <TextWithLogic variant="meta" mono truncate>
        docs/facets/features/tasks/create/quick-add.yaml
      </TextWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
