import { render, screen } from "@testing-library/react";
import GherkinStatementWithLogic, { GherkinStatement, withGherkinStatementLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const statement = [
  'Given a list "Groceries" exists',
  'When the user enters "Buy milk"',
  "Then the task is created",
  "And it appears at the top",
].join("\n");

describe("Unit tests for GherkinStatement", () => {
  it("renders one line per step", () => {
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
            role: "GIVEN",
            tokens: [{ kind: "prose", text: "a list exists" }],
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
    expect(screen.getByText("GIVEN")).toBeInTheDocument();
  });
});

describe("Unit tests for withGherkinStatementLogic", () => {
  it("parses the statement into steps", () => {
    const { container } = render(<GherkinStatementWithLogic statement={statement} />);
    expect(container.querySelectorAll("[data-step]")).toHaveLength(4);
  });

  it("shows the roles in capitals", () => {
    render(<GherkinStatementWithLogic statement={statement} />);
    expect(screen.getByText("GIVEN")).toBeInTheDocument();
    expect(screen.getByText("WHEN")).toBeInTheDocument();
    expect(screen.getByText("THEN")).toBeInTheDocument();
    expect(screen.getByText("AND")).toBeInTheDocument();
  });

  it("colours the keywords by role", () => {
    render(<GherkinStatementWithLogic statement={statement} />);
    expect(screen.getByText("Given")).toHaveStyle({ color: "var(--ok)" });
    expect(screen.getByText("When")).toHaveStyle({ color: "var(--signal)" });
    expect(screen.getByText("Then")).toHaveStyle({ color: "var(--plan)" });
  });

  it("emphasises the outcome with weight, not only with colour", () => {
    render(<GherkinStatementWithLogic statement={statement} />);
    expect(screen.getByText("Then")).toHaveStyle({ fontWeight: 500 });
  });

  it("highlights quoted values", () => {
    render(<GherkinStatementWithLogic statement={'Given a list "Groceries" exists'} />);
    expect(screen.getByText('"Groceries"')).toHaveStyle({ color: "var(--signal)" });
  });

  it("highlights placeholders as an open spot", () => {
    render(<GherkinStatementWithLogic statement={"When <user> saves"} />);
    expect(screen.getByText("<user>")).toHaveStyle({ color: "var(--due)" });
  });

  it("accepts already parsed steps", () => {
    const { container } = render(
      <GherkinStatementWithLogic steps={[{ keyword: "THEN", parent: "THEN", text: "is saved" }]} />,
    );
    expect(container.querySelectorAll("[data-step]")).toHaveLength(1);
  });

  it("stays empty with an empty statement", () => {
    const { container } = render(<GherkinStatementWithLogic statement="" />);
    expect(container.querySelectorAll("[data-step]")).toHaveLength(0);
  });

  it("assigns a descriptive displayName", () => {
    expect(withGherkinStatementLogic(GherkinStatement).displayName).toBe(
      "withGherkinStatementLogic(GherkinStatement)",
    );
  });
});

describe("Unit tests for the German locale", () => {
  it("shows the roles in German under the German locale", () => {
    renderInGerman(<GherkinStatementWithLogic statement={statement} />);
    expect(screen.getByText("AUSGANGSLAGE")).toBeInTheDocument();
    expect(screen.getByText("AKTION")).toBeInTheDocument();
    expect(screen.getByText("ERGEBNIS")).toBeInTheDocument();
    expect(screen.getByText("UND")).toBeInTheDocument();
  });
});

describe("Snapshot tests for GherkinStatement", () => {
  it("complete promise", () => {
    const { container } = render(<GherkinStatementWithLogic statement={statement} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("compact", () => {
    const { container } = render(<GherkinStatementWithLogic statement={statement} compact />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
