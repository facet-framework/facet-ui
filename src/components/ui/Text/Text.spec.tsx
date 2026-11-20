import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Text/Text.spec.text";
import { render, screen } from "@testing-library/react";
import TextWithLogic, { Text, withTextLogic } from ".";

describe("Unit tests for Text", () => {
  it("renders children in a span by default", () => {
    render(<Text computedStyle={{ color: "red" }}>{germanLabels.text7}</Text>);
    expect(screen.getByText(germanLabels.text7).tagName).toBe("SPAN");
  });

  it("renders the requested element", () => {
    render(
      <Text as="h2" computedStyle={{}}>
        {localized.text3}
      </Text>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(localized.text4);
  });

  it("preserves the computed style", () => {
    render(
      <Text computedStyle={{ fontWeight: 500, color: "rgb(17, 19, 24)" }}>
        {germanLabels.text173}
      </Text>,
    );
    expect(screen.getByText(germanLabels.text173)).toHaveStyle({ fontWeight: 500 });
  });

  it("forwards additional attributes to the element", () => {
    render(
      <Text computedStyle={{}} title={remainingText.text17} data-testid="value">
        4
      </Text>,
    );
    expect(screen.getByTestId("value")).toHaveAttribute("title", remainingText.text17);
  });

  it("renders without children", () => {
    const { container } = render(<Text computedStyle={{}} data-testid={"empty"} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});

describe("Unit tests for withTextLogic", () => {
  it("uses body text by default", () => {
    render(<TextWithLogic>Standard</TextWithLogic>);
    expect(screen.getByText("Standard")).toHaveStyle({ fontFamily: "var(--font-sans)" });
  });

  it("uses monospace for field values", () => {
    render(<TextWithLogic mono>tasks/create/quick-add</TextWithLogic>);
    expect(screen.getByText("tasks/create/quick-add")).toHaveStyle({
      fontFamily: "var(--font-mono)",
    });
  });

  it("maps tone to its semantic color", () => {
    render(<TextWithLogic tone="deadline">{localized.text11}</TextWithLogic>);
    expect(screen.getByText(localized.text12)).toHaveStyle({ color: "var(--deadline)" });
  });

  it("truncates on one line instead of wrapping", () => {
    render(<TextWithLogic truncate>packages/core/src/lists/store.ts</TextWithLogic>);
    expect(screen.getByText("packages/core/src/lists/store.ts")).toHaveStyle({
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    });
  });

  it("limits descriptions to the requested line count", () => {
    render(<TextWithLogic clamp={2}>{labelText.text453}</TextWithLogic>);
    expect(screen.getByText(labelText.text453)).toHaveStyle({ WebkitLineClamp: "2" });
  });

  it("lets custom styles override computed styles", () => {
    render(<TextWithLogic style={{ color: "rgb(0, 0, 0)" }}>{labelText.text454}</TextWithLogic>);
    expect(screen.getByText(labelText.text454)).toHaveStyle({ color: "rgb(0, 0, 0)" });
  });

  it("forwards props to the presentation component", () => {
    render(
      <TextWithLogic as="p" id={"lead"} variant="hero">
        {labelText.text456}
      </TextWithLogic>,
    );
    const node = screen.getByText(labelText.text456);
    expect(node.tagName).toBe("P");
    expect(node).toHaveAttribute("id", "lead");
  });

  it("sets a descriptive displayName", () => {
    expect(withTextLogic(Text).displayName).toBe("withTextLogic(Text)");
  });
});

describe("Snapshot tests for Text", () => {
  it("body text", () => {
    const { container } = render(<TextWithLogic>{localized.text19}</TextWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Lead sentence as a hero", () => {
    const { container } = render(
      <TextWithLogic as="p" variant="hero">
        16 Punkte brauchen dich
      </TextWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Uppercase factual label", () => {
    const { container } = render(
      <TextWithLogic variant="label" tone="dim">
        {germanLabels.text175}
      </TextWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Single-line monospace field value", () => {
    const { container } = render(
      <TextWithLogic variant="meta" mono truncate>
        docs/facets/features/tasks/create/quick-add.yaml
      </TextWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
