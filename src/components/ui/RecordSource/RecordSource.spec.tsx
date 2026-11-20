import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/RecordSource/RecordSource.spec.text";
import { render, screen } from "@testing-library/react";
import RecordSourceWithLogic, { RecordSource, tokenizeYamlLine, withRecordSourceLogic } from ".";

const raw = ["id: tasks/create/quick-add", remainingText.text159, "tags:", "  - offline"].join(
  "\n",
);

describe("Unit tests for RecordSource", () => {
  it("renders a number and content for each line", () => {
    const { container } = render(
      <RecordSource
        containerStyle={{}}
        captionStyle={{}}
        caption={labelText.text313}
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
  it("separates keys and values", () => {
    expect(tokenizeYamlLine("id: a/b/c")).toEqual([
      { kind: "key", text: "id" },
      { kind: "punct", text: ": " },
      { kind: "value", text: "a/b/c" },
    ]);
  });

  it("recognizes comments", () => {
    expect(tokenizeYamlLine(remainingText.text159)).toContainEqual({
      kind: "comment",
      text: remainingText.text160,
    });
  });

  it("recognizes list entries", () => {
    expect(tokenizeYamlLine("  - offline")[0]).toEqual({ kind: "marker", text: "  - " });
  });

  it("preserves indentation", () => {
    expect(tokenizeYamlLine("  summary: x")[0]).toEqual({ kind: "punct", text: "  " });
  });

  it("returns lines without keys as values", () => {
    expect(tokenizeYamlLine(localized.text7)).toEqual([{ kind: "value", text: localized.text8 }]);
  });

  it("preserves empty lines", () => {
    expect(tokenizeYamlLine("   ")).toEqual([]);
  });
});

describe("Unit tests for withRecordSourceLogic", () => {
  it("numbers every line", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} />);
    expect(container.querySelectorAll("[data-line]")).toHaveLength(4);
  });

  it("names the path and line count above the source", () => {
    render(<RecordSourceWithLogic raw={raw} path="quick-add.yaml" />);
    expect(screen.getByText(labelText.text314)).toBeInTheDocument();
  });

  it("highlights the requested line", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} markLine={2} />);
    expect(container.querySelector('[data-line="2"]')).toHaveStyle({
      background: "var(--deadline-soft)",
    });
  });

  it("trims the trailing empty line", () => {
    const { container } = render(<RecordSourceWithLogic raw={"a: 1\n"} />);
    expect(container.querySelectorAll("[data-line]")).toHaveLength(1);
  });

  it("handles an empty file", () => {
    render(<RecordSourceWithLogic raw="" />);
    expect(screen.getByText(labelText.text313)).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withRecordSourceLogic(RecordSource).displayName).toBe(
      "withRecordSourceLogic(RecordSource)",
    );
  });
});

describe("Snapshot tests for RecordSource", () => {
  it("Raw source", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} path="quick-add.yaml" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("with an error line", () => {
    const { container } = render(<RecordSourceWithLogic raw={raw} markLine={2} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
