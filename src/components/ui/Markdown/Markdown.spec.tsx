import { render, screen } from "@testing-library/react";
import MarkdownWithLogic, { Markdown } from ".";

describe("Unit tests for withMarkdownLogic", () => {
  it("shows a paragraph as a paragraph", () => {
    const { container } = render(<MarkdownWithLogic text="One sentence." />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container).toHaveTextContent("One sentence.");
  });

  it("shows a bullet list as a list", () => {
    const { container } = render(<MarkdownWithLogic text={"- one\n- two"} />);
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
  });

  it("tells numbered from unnumbered lists", () => {
    const { container } = render(<MarkdownWithLogic text={"1. one\n2. two"} />);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("shows a code block unchanged and names its language", () => {
    const { container } = render(
      <MarkdownWithLogic text={"```yaml\nid: a/b/c\nlifecycle: active\n```"} />,
    );
    const pre = container.querySelector("pre");
    expect(pre).toHaveAttribute("data-language", "yaml");
    expect(pre).toHaveTextContent("id: a/b/c");
  });

  it("highlights bold and code in running text", () => {
    const { container } = render(<MarkdownWithLogic text="**important** and `code`" />);
    const spans = Array.from(container.querySelectorAll("span"));
    expect(spans.some((span) => span.textContent === "important")).toBe(true);
    expect(spans.some((span) => span.textContent === "code")).toBe(true);
  });

  it("turns an http link into a link", () => {
    render(<MarkdownWithLogic text="see [the spec](https://example.org/spec)" />);
    const link = screen.getByRole("link", { name: "the spec" });
    expect(link).toHaveAttribute("href", "https://example.org/spec");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("turns everything else into text — the sender is a model", () => {
    render(<MarkdownWithLogic text="[click](data:text/html,boom)" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("click (data:text/html,boom)")).toBeInTheDocument();
  });

  it("also names the target of a withheld link", () => {
    // Hiding it would be worse than showing it: whoever sees the address can
    // decide for themselves whether to paste it anywhere.
    render(<MarkdownWithLogic text="[Guide](file:///etc/passwd)" />);
    expect(screen.getByText(/file:\/\/\/etc\/passwd/)).toBeInTheDocument();
  });

  it("shows heading, quote and rule in their own form", () => {
    const { container } = render(
      <MarkdownWithLogic text={"## Title\n\n> a quote\n\n---\n\nanother sentence"} />,
    );
    expect(container.querySelector("h4")).toHaveTextContent("Title");
    expect(container.querySelector("blockquote")).toHaveTextContent("a quote");
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("copes with empty text", () => {
    const { container } = render(<MarkdownWithLogic text="" />);
    expect(container.querySelector("div")?.children).toHaveLength(0);
  });
});

describe("Unit tests for Markdown", () => {
  it("accepts the plain version without blocks", () => {
    const { container } = render(<Markdown containerStyle={{}} blocks={[]} />);
    expect(container.firstChild).not.toBeNull();
  });
});
