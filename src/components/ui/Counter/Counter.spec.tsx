import { act, render, screen } from "@testing-library/react";
import CounterWithLogic, { Counter, withCounterLogic } from ".";

describe("Unit tests for Counter", () => {
  it("shows the current value and an accessible final value", () => {
    render(<Counter display="12" finalLabel="16" computedStyle={{}} data-testid="counter" />);
    const node = screen.getByTestId("counter");
    expect(node).toHaveTextContent("12");
    expect(node).toHaveTextContent("16");
  });

  it("forwards attributes", () => {
    const { container } = render(<Counter display="12" finalLabel="16" computedStyle={{}} />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("12");
  });
});

describe("Unit tests for withCounterLogic", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("counts from zero to the final value", () => {
    render(<CounterWithLogic value={80} duration={400} data-testid="counter" />);
    const node = screen.getByTestId("counter");
    expect(node.firstChild).toHaveTextContent("0");
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(node.firstChild).toHaveTextContent("80");
  });

  it("accepts numeric spacing", () => {
    render(<CounterWithLogic value={77} unit=" %" data-testid="counter" />);
    expect(screen.getByTestId("counter")).toHaveTextContent("77 %");
  });

  it("describes the state", () => {
    render(<CounterWithLogic value={38} animate={false} data-testid="counter" />);
    expect(screen.getByTestId("counter").firstChild).toHaveTextContent("38");
  });

  it("jumps to subsequent values without restarting", () => {
    const { rerender } = render(
      <CounterWithLogic value={10} duration={80} data-testid="counter" />,
    );
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender(<CounterWithLogic value={42} duration={80} data-testid="counter" />);
    expect(screen.getByTestId("counter").firstChild).toHaveTextContent("42");
  });

  it("clears the timer on unmount", () => {
    const clear = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<CounterWithLogic value={50} />);
    unmount();
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });

  it("stays static with reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })) as unknown as typeof window.matchMedia;

    render(<CounterWithLogic value={64} data-testid={"quiet"} />);
    expect(screen.getByTestId("quiet").firstChild).toHaveTextContent("64");
    window.matchMedia = original;
  });

  it("sets a descriptive displayName", () => {
    expect(withCounterLogic(Counter).displayName).toBe("withCounterLogic(Counter)");
  });
});

describe("Snapshot tests for Counter", () => {
  it("static value", () => {
    const { container } = render(<CounterWithLogic value={16} animate={false} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("percentage with a unit", () => {
    const { container } = render(<CounterWithLogic value={77} unit=" %" animate={false} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
