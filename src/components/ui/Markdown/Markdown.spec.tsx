import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/Markdown/Markdown.spec.text";
import { render, screen } from "@testing-library/react";
import MarkdownWithLogic, { Markdown } from ".";

describe("Unit tests for withMarkdownLogic", () => {
  it("renders paragraphs as paragraphs", () => {
    const { container } = render(<MarkdownWithLogic text={localized.text2} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container).toHaveTextContent(localized.text3);
  });

  it("renders bullet points as a list", () => {
    const { container } = render(<MarkdownWithLogic text={labelText.text434} />);
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
  });

  it("distinguishes ordered and unordered lists", () => {
    const { container } = render(<MarkdownWithLogic text={labelText.text369} />);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("preserves code blocks and names their language", () => {
    const { container } = render(
      <MarkdownWithLogic text={"```yaml\nid: a/b/c\nlifecycle: active\n```"} />,
    );
    const pre = container.querySelector("pre");
    expect(pre).toHaveAttribute("data-language", "yaml");
    expect(pre).toHaveTextContent("id: a/b/c");
  });

  it("emphasizes bold text and inline code", () => {
    const { container } = render(<MarkdownWithLogic text={localized.text8} />);
    const spans = Array.from(container.querySelectorAll("span"));
    expect(spans.some((span) => span.textContent === labelText.text393)).toBe(true);
    expect(spans.some((span) => span.textContent === "code")).toBe(true);
  });

  it("renders HTTP references as links", () => {
    render(<MarkdownWithLogic text={localized.text10} />);
    const link = screen.getByRole("link", { name: localized.text11 });
    expect(link).toHaveAttribute("href", "https://example.org/spec");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("renders other destinations as text because the sender is a model", () => {
    render(<MarkdownWithLogic text="[klick](data:text/html,boom)" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("klick (data:text/html,boom)")).toBeInTheDocument();
  });

  it("names the destination of a withheld link", () => {
    render(<MarkdownWithLogic text={labelText.text435} />);
    expect(screen.getByText(/file:\/\/\/etc\/passwd/)).toBeInTheDocument();
  });

  it("renders headings, quotes and separators with their own elements", () => {
    const { container } = render(<MarkdownWithLogic text={localized.text15} />);
    expect(container.querySelector("h4")).toHaveTextContent(labelText.text9);
    expect(container.querySelector("blockquote")).toHaveTextContent(localized.text16);
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("handles empty text", () => {
    const { container } = render(<MarkdownWithLogic text="" />);
    expect(container.querySelector("div")?.children).toHaveLength(0);
  });
});

describe("Unit tests for Markdown", () => {
  it("accepts an empty block list", () => {
    const { container } = render(<Markdown containerStyle={{}} blocks={[]} />);
    expect(container.firstChild).not.toBeNull();
  });
});
