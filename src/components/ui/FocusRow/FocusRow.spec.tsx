import { localized } from "../../../i18n/legacy/components/ui/FocusRow/FocusRow.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FocusRowWithLogic, { FocusRow, withFocusRowLogic } from ".";

const styles = {
  containerStyle: {},
  headerStyle: {},
  rankStyle: {},
  titleStyle: {},
  whyStyle: {},
  metaStyle: {},
  bodyStyle: {},
};

describe("Unit tests for FocusRow", () => {
  it("shows the rank, title and reason", () => {
    render(
      <FocusRow
        {...styles}
        rank="01"
        title="Quiet hours"
        why={localized.text2}
        open={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Quiet hours")).toBeInTheDocument();
    expect(screen.getByText(localized.text3)).toBeInTheDocument();
  });

  it("omits metadata when none is provided", () => {
    const { container } = render(
      <FocusRow
        {...styles}
        rank="01"
        title="A"
        why="B"
        open={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(container.querySelectorAll("span")).toHaveLength(3);
  });

  it("shows content only while open", () => {
    const { rerender } = render(
      <FocusRow
        {...styles}
        rank="01"
        title="A"
        why="B"
        open={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>{localized.text6}</p>
      </FocusRow>,
    );
    expect(screen.queryByText(localized.text7)).not.toBeInTheDocument();

    rerender(
      <FocusRow
        {...styles}
        rank="01"
        title="A"
        why="B"
        open
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>{localized.text8}</p>
      </FocusRow>,
    );
    expect(screen.getByText(localized.text9)).toBeInTheDocument();
  });

  it("exposes state through aria-expanded", () => {
    render(
      <FocusRow
        {...styles}
        rank="01"
        title="A"
        why="B"
        open
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Unit tests for withFocusRowLogic", () => {
  const base = { id: "a", rank: 3, title: "Quiet hours", why: localized.text11 };

  it("renders its children", () => {
    render(<FocusRowWithLogic {...base} />);
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("opens on click", async () => {
    const onOpenChange = jest.fn();
    render(<FocusRowWithLogic {...base} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledWith("a");
  });

  it("closes an already open row", async () => {
    const onOpenChange = jest.fn();
    render(<FocusRowWithLogic {...base} openId="a" onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledWith(null);
  });

  it("opens with Enter and closes with Escape", async () => {
    const onOpenChange = jest.fn();
    const { rerender } = render(<FocusRowWithLogic {...base} onOpenChange={onOpenChange} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onOpenChange).toHaveBeenLastCalledWith("a");

    rerender(<FocusRowWithLogic {...base} openId="a" onOpenChange={onOpenChange} />);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(null);
  });

  it("opens with ArrowRight before advancing a level", async () => {
    const onOpenChange = jest.fn();
    const onDeeper = jest.fn();
    const { rerender } = render(
      <FocusRowWithLogic {...base} onOpenChange={onOpenChange} onDeeper={onDeeper} />,
    );
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(onOpenChange).toHaveBeenLastCalledWith("a");
    expect(onDeeper).not.toHaveBeenCalled();

    rerender(
      <FocusRowWithLogic {...base} openId="a" onOpenChange={onOpenChange} onDeeper={onDeeper} />,
    );
    await userEvent.keyboard("{ArrowRight}");
    expect(onDeeper).toHaveBeenCalledWith("a");
  });

  it("moves back with ArrowLeft", async () => {
    const onOpenChange = jest.fn();
    render(<FocusRowWithLogic {...base} openId="a" onOpenChange={onOpenChange} />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onOpenChange).toHaveBeenCalledWith(null);
  });

  it("dims unrelated rows but keeps the open row clear", () => {
    const { rerender, container } = render(<FocusRowWithLogic {...base} dimmed />);
    expect(container.firstChild).toHaveStyle({ opacity: "0.42" });
    rerender(<FocusRowWithLogic {...base} dimmed openId="a" />);
    expect(container.firstChild).toHaveStyle({ opacity: "1" });
  });

  it("colors only the deadline reason red", () => {
    render(<FocusRowWithLogic {...base} overdue />);
    expect(screen.getByText(localized.text19)).toHaveStyle({ color: "var(--deadline)" });
    expect(screen.getByText("Quiet hours")).toHaveStyle({ color: "var(--ink)" });
  });

  it("handles missing callbacks", async () => {
    render(<FocusRowWithLogic {...base} />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("sets a descriptive displayName", () => {
    expect(withFocusRowLogic(FocusRow).displayName).toBe("withFocusRowLogic(FocusRow)");
  });
});

describe("Snapshot tests for FocusRow", () => {
  it("compact", () => {
    const { container } = render(
      <FocusRowWithLogic rank={1} id="a" title="Quiet hours" why={localized.text22} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("open with evidence", () => {
    const { container } = render(
      <FocusRowWithLogic rank={1} id="a" openId="a" title="Quiet hours" why={localized.text24}>
        <p>{localized.text25}</p>
      </FocusRowWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("muted neighboring row", () => {
    const { container } = render(
      <FocusRowWithLogic
        rank={2}
        id="b"
        openId="a"
        dimmed
        title="Task search"
        why={localized.text27}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
