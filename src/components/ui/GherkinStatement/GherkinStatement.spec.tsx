import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/GherkinStatement/GherkinStatement.spec.text";
import { render, screen } from "@testing-library/react";
import GherkinStatementWithLogic, { GherkinStatement, withGherkinStatementLogic } from ".";

const statement = [
  localized.text1,
  localized.text2,
  localized.text3,
  "And erscheint sie oben",
].join("\n");

describe("Unit tests for GherkinStatement", () => {
  it("renders one row per step", () => {
    const { container } = render(
      <GherkinStatement
        containerStyle={{}}
        textStyle={{}}
        tokenStyle={{
          quoted: {},
          placeholder: {},
          identifier: {},
          literal: {},
          number: {},
          prose: {},
        }}
        steps={[
          {
            key: "0",
            keyword: "Given",
            role: "AUSGANGSLAGE",
            tokens: [{ kind: "prose", text: localized.text5 }],
            keywordStyle: {},
            roleStyle: {},
            railStyle: {},
            rowStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-step]")).toHaveLength(1);
    expect(screen.getByText("Given")).toBeInTheDocument();
    expect(screen.getByText("AUSGANGSLAGE")).toBeInTheDocument();
  });
});

describe("Unit tests for withGherkinStatementLogic", () => {
  it("parses the statement into steps", () => {
    const { container } = render(<GherkinStatementWithLogic statement={statement} />);
    expect(container.querySelectorAll("[data-step]")).toHaveLength(4);
  });

  it("shows German step roles", () => {
    render(<GherkinStatementWithLogic statement={statement} />);
    expect(screen.getByText("AUSGANGSLAGE")).toBeInTheDocument();
    expect(screen.getByText("AKTION")).toBeInTheDocument();
    expect(screen.getByText(labelText.text331)).toBeInTheDocument();
    expect(screen.getByText(localized.text8)).toBeInTheDocument();
  });

  it("colors keywords by role", () => {
    render(<GherkinStatementWithLogic statement={statement} />);
    expect(screen.getByText("Given")).toHaveStyle({ color: "var(--ok)" });
    expect(screen.getByText("When")).toHaveStyle({ color: "var(--signal)" });
    expect(screen.getByText("Then")).toHaveStyle({ color: "var(--plan)" });
  });

  it("emphasizes the outcome with weight as well as color", () => {
    render(<GherkinStatementWithLogic statement={statement} />);
    expect(screen.getByText("Then")).toHaveStyle({ fontWeight: 500 });
  });

  it("highlights quoted values", () => {
    render(<GherkinStatementWithLogic statement={localized.text11} />);
    expect(screen.getByText('"Einkauf"')).toHaveStyle({ color: "var(--signal)" });
  });

  it("reads the reason from the error", () => {
    render(<GherkinStatementWithLogic statement={"When <nutzer> speichert"} />);
    expect(screen.getByText("<nutzer>")).toHaveStyle({ color: "var(--deadline)" });
  });

  it("accepts custom levels", () => {
    const { container } = render(
      <GherkinStatementWithLogic
        steps={[{ keyword: "THEN", parent: "THEN", text: localized.text12 }]}
      />,
    );
    expect(container.querySelectorAll("[data-step]")).toHaveLength(1);
  });

  it("stays empty for an empty statement", () => {
    const { container } = render(<GherkinStatementWithLogic statement="" />);
    expect(container.querySelectorAll("[data-step]")).toHaveLength(0);
  });

  it("sets a descriptive displayName", () => {
    expect(withGherkinStatementLogic(GherkinStatement).displayName).toBe(
      "withGherkinStatementLogic(GherkinStatement)",
    );
  });
});

describe("Snapshot tests for GherkinStatement", () => {
  it("complete promise", () => {
    const { container } = render(<GherkinStatementWithLogic statement={statement} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("converts values into shares", () => {
    const { container } = render(<GherkinStatementWithLogic statement={statement} compact />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
