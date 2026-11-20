import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import RecordSourceWithLogic, { RecordSource, tokenizeYamlLine, withRecordSourceLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const raw = [
  "id: tasks/create/quick-add",
  "lifecycle: active # active",
  "tags:",
  "  - offline",
].join("\n");

describe("Unit tests for RecordSource", () => {
  it("renders a number and its content per line", () => {
    const { container } = render(
      <RecordSource
        containerStyle={{}}
        captionStyle={{}}
        caption="1 line"
        tokenStyle={{ key: {}, value: {}, punct: {}, comment: {}, marker: {} }}
        lines={[
          {
            key: "1",
            number: "1",
            marked: false,
            tokens: [
              { kind: "key", text: "id" },
              { kind: "punct", text: ": " },
              { kind: "value", text: "a/b/c" },
            ],
            rowStyle: {},
            numberStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-line]")).toHaveLength(1);
    expect(screen.getByText("a/b/c")).toBeInTheDocument();
  });
});

describe("Unit tests for tokenizeYamlLine", () => {
  it("separates key and value", () => {
    expect(tokenizeYamlLine("id: a/b/c")).toEqual([
      { kind: "key", text: "id" },
      { kind: "punct", text: ": " },
      { kind: "value", text: "a/b/c" },
    ]);
  });

  it("recognises comments", () => {
    expect(tokenizeYamlLine("lifecycle: active # active")).toContainEqual({
      kind: "comment",
      text: "# active",
    });
  });

  it("recognises list entries", () => {
    expect(tokenizeYamlLine("  - offline")[0]).toEqual({ kind: "marker", text: "  - " });
  });

  it("keeps the indentation", () => {
    expect(tokenizeYamlLine("  summary: x")[0]).toEqual({ kind: "punct", text: "  " });
  });

  it("returns lines without a key as a value", () => {
    expect(tokenizeYamlLine("text only")).toEqual([{ kind: "value", text: "text only" }]);
  });

  it("leaves empty lines empty", () => {
    expect(tokenizeYamlLine("   ")).toEqual([]);
  });
});

describe("Unit tests for withRecordSourceLogic", () => {
  it("numbers all lines", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} />);
    expect(container.querySelectorAll("[data-line]")).toHaveLength(4);
  });

  it("names path and line count above the source", () => {
    render(<RecordSourceWithLogic raw={raw} path="quick-add.yaml" />);
    expect(screen.getByText("quick-add.yaml · 4 lines")).toBeInTheDocument();
  });

  it("highlights the given line", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} markLine={2} />);
    expect(container.querySelector('[data-line="2"]')).toHaveStyle({
      background: "var(--due-soft)",
    });
  });

  it("cuts off the trailing empty line", () => {
    const { container } = render(<RecordSourceWithLogic raw={"a: 1\n"} />);
    expect(container.querySelectorAll("[data-line]")).toHaveLength(1);
  });

  it("copes with an empty file", () => {
    render(<RecordSourceWithLogic raw="" />);
    expect(screen.getByText("1 line")).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withRecordSourceLogic(RecordSource).displayName).toBe(
      "withRecordSourceLogic(RecordSource)",
    );
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<RecordSourceWithLogic raw={raw} path="quick-add.yaml" />);
    expect(
      screen.getByText(`quick-add.yaml · ${germanText.plural("elements.recordSource.lines", 4)}`),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for RecordSource", () => {
  it("raw source", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} path="quick-add.yaml" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("with an error line", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} markLine={2} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
