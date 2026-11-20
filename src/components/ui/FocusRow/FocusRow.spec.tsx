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
  it("shows rank, title and reason", () => {
    render(
      <FocusRow
        {...styles}
        rank="01"
        title="Quiet hours"
        why="Check overdue"
        open={false}
        onToggle={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Quiet hours")).toBeInTheDocument();
    expect(screen.getByText("Check overdue")).toBeInTheDocument();
  });

  it("drops the meta column when nothing is given", () => {
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

  it("shows the content only when open", () => {
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
        <p>Evidence</p>
      </FocusRow>,
    );
    expect(screen.queryByText("Evidence")).not.toBeInTheDocument();

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
        <p>Evidence</p>
      </FocusRow>,
    );
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("reports the state via aria-expanded", () => {
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
  const base = { id: "a", rank: 3, title: "Quiet hours", why: "Check overdue" };

  it("renders the rank with two places", () => {
    render(<FocusRowWithLogic {...base} />);
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("opens on click", async () => {
    const onOpenChange = jest.fn();
    render(<FocusRowWithLogic {...base} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledWith("a");
  });

  it("closes the row that is already open", async () => {
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

  it("with arrow right first opens, then goes one level deeper", async () => {
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

  it("goes back with arrow left", async () => {
    const onOpenChange = jest.fn();
    render(<FocusRowWithLogic {...base} openId="a" onOpenChange={onOpenChange} />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onOpenChange).toHaveBeenCalledWith(null);
  });

  it("dims uninvolved rows, but not the open one", () => {
    const { rerender, container } = render(<FocusRowWithLogic {...base} dimmed />);
    expect(container.firstChild).toHaveStyle({ opacity: "0.42" });
    rerender(<FocusRowWithLogic {...base} dimmed openId="a" />);
    expect(container.firstChild).toHaveStyle({ opacity: "1" });
  });

  it("colours only the reason of a deadline red", () => {
    render(<FocusRowWithLogic {...base} overdue />);
    expect(screen.getByText("Check overdue")).toHaveStyle({ color: "var(--due)" });
    expect(screen.getByText("Quiet hours")).toHaveStyle({ color: "var(--ink)" });
  });

  it("copes without callbacks", async () => {
    render(<FocusRowWithLogic {...base} />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("assigns a descriptive displayName", () => {
    expect(withFocusRowLogic(FocusRow).displayName).toBe("withFocusRowLogic(FocusRow)");
  });
});

describe("Snapshot tests for FocusRow", () => {
  it("closed", () => {
    const { container } = render(
      <FocusRowWithLogic rank={1} id="a" title="Quiet hours" why="Check overdue" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("open with evidence", () => {
    const { container } = render(
      <FocusRowWithLogic rank={1} id="a" openId="a" title="Quiet hours" why="Check overdue">
        <p>Evidence</p>
      </FocusRowWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("dimmed neighbouring row", () => {
    const { container } = render(
      <FocusRowWithLogic
        rank={2}
        id="b"
        openId="a"
        dimmed
        title="Task search"
        why="no entry point"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
