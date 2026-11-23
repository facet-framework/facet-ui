import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Grid, Page, Row, Stack } from "./layout";
import { Select, TextArea, TextInput } from "./inputs";
import { BarChart, LineChart, Sparkline, chartColor, linePaths } from "./charts";
import { Avatar, Spinner, Timeline, avatarHue, initials } from "./activity";
import { ColorSwatches, Toolbar, ToolbarSeparator } from "./toolbar";
import { Field, IconButton } from "./controls";
import { renderInGerman } from "../i18n/testing";
import { de } from "../i18n";
import { AppBar } from "../shell";

describe("layout", () => {
  it("maps gap steps to the spacing scale and passes other props through", () => {
    render(
      <Stack gap={4} align="start" data-testid="stack">
        <Row gap={0} wrap justify="space-between" data-testid="row" as="ul">
          <li>a</li>
        </Row>
        <Grid min={180} gap={2} data-testid="grid" />
        <Grid min="12rem" fit data-testid="grid-rem" />
        <Page width="narrow" data-testid="page" />
        <Page data-testid="page-default" />
      </Stack>,
    );
    const stack = screen.getByTestId("stack");
    expect(stack).toHaveClass("t-stack");
    expect(stack.style.gap).toBe("var(--t-s-4)");
    expect(stack.style.alignItems).toBe("start");
    const row = screen.getByTestId("row");
    expect(row.tagName).toBe("UL");
    expect(row).toHaveClass("t-row", "t-row--wrap");
    expect(row.style.gap).toBe("0");
    expect(row.style.justifyContent).toBe("space-between");
    const grid = screen.getByTestId("grid");
    expect(grid.style.getPropertyValue("--t-grid-min")).toBe("180px");
    expect(grid.style.gap).toBe("var(--t-s-2)");
    expect(screen.getByTestId("grid-rem")).toHaveClass("t-grid--fit");
    expect(grid).not.toHaveClass("t-grid--fit");
    expect(screen.getByTestId("grid-rem").style.getPropertyValue("--t-grid-min")).toBe("12rem");
    expect(screen.getByTestId("page")).toHaveClass("t-page", "t-page--narrow");
    expect(screen.getByTestId("page-default").className).toBe("t-page");
  });
});

describe("inputs", () => {
  it("reports the new value and keeps the native handler", async () => {
    const values: string[] = [];
    const native = jest.fn();
    function Form() {
      const [v, setV] = useState("");
      return (
        <Field label="Title" error={v === "x" ? "Too short" : undefined}>
          {(id) => (
            <TextInput
              id={id}
              value={v}
              invalid={v === "x"}
              onChange={native}
              onValueChange={(next) => {
                values.push(next);
                setV(next);
              }}
            />
          )}
        </Field>
      );
    }
    render(<Form />);
    const box = screen.getByLabelText("Title");
    await userEvent.type(box, "x");
    expect(values).toEqual(["x"]);
    expect(native).toHaveBeenCalledTimes(1);
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("renders a textarea and a native select with their options", async () => {
    const text = jest.fn();
    const picked = jest.fn();
    render(
      <>
        <TextArea aria-label="Notes" code onValueChange={text} />
        <Select
          aria-label="Owner"
          defaultValue="a"
          invalid
          onValueChange={picked}
          options={[
            { value: "a", label: "Ada" },
            { value: "b", label: "Bo" },
            { value: "c", label: "Cy", disabled: true },
          ]}
        />
      </>,
    );
    await userEvent.type(screen.getByLabelText("Notes"), "hi");
    expect(text).toHaveBeenLastCalledWith("hi");
    expect(screen.getByLabelText("Notes")).toHaveClass("t-textarea--code");
    const select = screen.getByLabelText("Owner");
    expect(select).toHaveAttribute("aria-invalid", "true");
    await userEvent.selectOptions(select, "b");
    expect(picked).toHaveBeenCalledWith("b");
    expect(screen.getByRole("option", { name: "Cy" })).toBeDisabled();
  });

  it("leaves aria-invalid off a valid control", () => {
    render(<TextInput aria-label="Name" mono defaultValue="a" />);
    const box = screen.getByLabelText("Name");
    expect(box).not.toHaveAttribute("aria-invalid");
    expect(box).toHaveClass("t-mono");
  });
});

describe("charts", () => {
  it("breaks a line at a missing value instead of drawing it as zero", () => {
    const runs = linePaths([1, 2, null, 4, 5], 100, 20, 0, 5, 0);
    expect(runs).toHaveLength(2);
    expect(runs[0]).toBe("M0.00 16.00 L25.00 12.00");
    expect(runs[1]).toBe("M75.00 4.00 L100.00 0.00");
    expect(linePaths([null, null], 10, 10, 0, 1)).toEqual([]);
  });

  it("maps tones to series and status colours", () => {
    expect(chartColor(undefined, 5)).toBe("var(--t-series-2)");
    expect(chartColor(3)).toBe("var(--t-series-3)");
    expect(chartColor("warn")).toBe("var(--t-warn)");
  });

  it("names a sparkline with its latest measured value and draws its area", () => {
    const { container } = render(<Sparkline label="Tokens" values={[3, 1200, null]} area />);
    expect(screen.getByRole("img", { name: "Tokens: 1,200" })).toBeInTheDocument();
    expect(container.querySelectorAll(".t-spark__line")).toHaveLength(1);
    expect(container.querySelector(".t-spark__area")?.getAttribute("d")).toMatch(/Z$/);
    const empty = render(<Sparkline label="Empty" values={[null, null]} area={false} />);
    const none = screen.getByRole("img", { name: "Empty: not measured" });
    expect(none).toHaveAttribute("data-state", "unmeasured");
    expect(empty.container.querySelector(".t-spark__none")).not.toBeNull();
    expect(empty.container.querySelector(".t-spark__line")).toBeNull();
  });

  it("draws a lone measured value between two gaps as a dot", () => {
    const { container } = render(<Sparkline label="Runs" values={[null, 4, null]} />);
    expect(container.querySelector(".t-spark__dot")).not.toBeNull();
    expect(container.querySelector(".t-spark__line")).toBeNull();
    expect(screen.getByRole("img", { name: "Runs: 4" })).toBeInTheDocument();
  });

  it("writes every bar's value beside it and says when one is not measured", async () => {
    const pick = jest.fn();
    const { rerender } = render(
      <BarChart
        label="Coverage"
        unit="%"
        bars={[
          { key: "a", label: "Checkout", value: 80 },
          { key: "b", label: "Search", value: null },
          { key: "c", label: "Login", value: 40, display: "4 of 10", tone: "warn" },
        ]}
      />,
    );
    const list = screen.getByRole("list", { name: "Coverage" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Checkout80%");
    expect(rows[1]).toHaveTextContent("Searchnot measured");
    expect(rows[1].querySelector(".t-bars__fill")).toBeNull();
    expect(rows[2]).toHaveTextContent("4 of 10");
    const fill = rows[2].querySelector<HTMLElement>(".t-bars__fill")!;
    expect(fill.style.getPropertyValue("--t-value")).toBe("0.5");
    expect(fill.style.background).toBe("var(--t-warn)");
    // One measure is one colour: bars without a tone share the chart's tone.
    expect(rows[0].querySelector<HTMLElement>(".t-bars__fill")!.style.background).toBe(
      "var(--t-signal)",
    );

    rerender(
      <BarChart
        label="Coverage"
        max={100}
        active="a"
        onPick={pick}
        bars={[{ key: "a", label: "Checkout", value: 80 }]}
      />,
    );
    const button = screen.getByRole("button", { name: /Checkout/ });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    expect(pick).toHaveBeenCalledWith("a");
  });

  it("keeps a table of every value for screen readers and shows a tooltip on hover", () => {
    const { container } = render(
      <LineChart
        label="Features by week"
        categories={["W1", "W2", "W3"]}
        unit=" ft"
        series={[
          { key: "active", label: "Active", values: [1, 2, 3] },
          { key: "planned", label: "Planned", values: [4, null, 2], tone: 3 },
        ]}
      />,
    );
    const table = screen.getByRole("table", { name: "Features by week" });
    const cells = within(table)
      .getAllByRole("row")
      .map((r) => r.textContent);
    expect(cells).toEqual(["ActivePlanned", "W11 ft4 ft", "W22 ft–", "W33 ft2 ft"]);
    expect(container.querySelectorAll(".t-linechart__line")).toHaveLength(3);
    expect(container.querySelector(".t-linechart__legend")).toHaveTextContent("ActivePlanned");

    const svg = container.querySelector("svg")!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 200 }) as DOMRect;
    fireEvent.pointerMove(svg);
    expect(container.querySelector(".t-linechart__tip")).toBeNull();
    // jsdom has no PointerEvent; a MouseEvent of that type carries the coordinates.
    fireEvent(svg, new MouseEvent("pointermove", { bubbles: true, clientX: 639, clientY: 10 }));
    const tip = container.querySelector(".t-linechart__tip")!;
    expect(tip).toHaveTextContent("W3Active 3 ftPlanned 2 ft");
    expect(container.querySelector(".t-linechart__cross")).not.toBeNull();
    fireEvent.pointerLeave(svg);
    expect(container.querySelector(".t-linechart__tip")).toBeNull();
  });

  it("draws one series without a legend", () => {
    const { container } = render(
      <LineChart
        label="One"
        categories={["a"]}
        series={[{ key: "x", label: "X", values: [2] }]}
        min={0}
        max={4}
      />,
    );
    expect(container.querySelector(".t-linechart__legend")).toBeNull();
  });
});

describe("activity", () => {
  it("derives initials and a stable colour from the name", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("review-bot")).toBe("RB");
    expect(initials("Q")).toBe("Q");
    expect(initials("  ")).toBe("?");
    expect(avatarHue("Ada")).toBe(avatarHue("Ada"));
    expect([1, 2, 3, 4]).toContain(avatarHue("anything"));
  });

  it("names the avatar and shows its state", () => {
    const { container } = render(
      <>
        <Avatar name="Ada Lovelace" status="ok" busy />
        <Avatar name="Planner" icon="spark" size={24} />
      </>,
    );
    const ada = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(ada).toHaveTextContent("AL");
    expect(ada).toHaveClass("t-avatar--busy");
    expect(ada.querySelector(".t-avatar__status")).toHaveClass("t-dot--ok");
    expect(screen.getByRole("img", { name: "Planner" }).querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll(".t-avatar__status")).toHaveLength(1);
  });

  it("lists events in order with their tone and live state", () => {
    render(
      <Timeline
        label="Run"
        items={[
          { key: "1", title: "Started", time: "14:02", tone: "ok", icon: "play" },
          { key: "2", title: "Reading files", body: "12 files", live: true, tone: "neutral" },
        ]}
      />,
    );
    const items = within(screen.getByRole("list", { name: "Run" })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Started14:02");
    expect(items[0]).toHaveClass("t-timeline__item--ok");
    expect(items[1]).toHaveClass("t-timeline__item--live");
    expect(items[1]).not.toHaveClass("t-timeline__item--neutral");
    expect(items[1]).toHaveTextContent("12 files");
  });

  it("labels the spinner in the active language", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    renderInGerman(<Spinner size={24} />);
    expect(
      screen.getByRole("status", { name: de["primitives.spinner.loading"] }),
    ).toBeInTheDocument();
  });
});

describe("toolbar", () => {
  it("moves focus with the arrow keys, Home and End", async () => {
    render(
      <Toolbar label="Tools" floating>
        <IconButton icon="plus" label="Add" />
        <ToolbarSeparator />
        <IconButton icon="trash" label="Delete" />
        <IconButton icon="fit" label="Fit" />
      </Toolbar>,
    );
    const bar = screen.getByRole("toolbar", { name: "Tools" });
    expect(bar).toHaveClass("t-tools--floating");
    const [add, del, fit] = within(bar).getAllByRole("button");
    add.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(del).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(fit).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(add).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(fit).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(add).toHaveFocus();
    await userEvent.keyboard("a");
    expect(add).toHaveFocus();
  });

  it("moves vertically in a vertical toolbar", async () => {
    render(
      <Toolbar label="Side" orientation="vertical">
        <IconButton icon="plus" label="Add" />
        <IconButton icon="minus" label="Remove" />
      </Toolbar>,
    );
    const bar = screen.getByRole("toolbar", { name: "Side" });
    expect(bar).toHaveAttribute("aria-orientation", "vertical");
    const [add, remove] = within(bar).getAllByRole("button");
    add.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(add).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(remove).toHaveFocus();
  });

  it("does nothing in an empty toolbar", () => {
    render(<Toolbar label="Empty">{null}</Toolbar>);
    fireEvent.keyDown(screen.getByRole("toolbar"), { key: "ArrowRight" });
    expect(screen.getByRole("toolbar")).toBeEmptyDOMElement();
  });

  it("picks a colour and keeps only the chosen swatch in the tab order", async () => {
    function Picker() {
      const [v, setV] = useState<"y" | "b">("y");
      return (
        <ColorSwatches
          label="Colour"
          value={v}
          onChange={setV}
          options={[
            { value: "y", label: "Yellow", color: "#ffd" },
            { value: "b", label: "Blue", color: "#ddf" },
          ]}
        />
      );
    }
    render(<Picker />);
    const blue = screen.getByRole("radio", { name: "Blue" });
    expect(blue).toHaveAttribute("tabindex", "-1");
    await userEvent.click(blue);
    expect(blue).toHaveAttribute("aria-checked", "true");
    expect(blue).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Yellow" })).toHaveAttribute("aria-checked", "false");
  });
});

describe("AppBar", () => {
  it("renders only the parts it is given", () => {
    const { rerender, container } = render(
      <AppBar brand="Crew" title="Run 42" meta="running" actions={<button>Stop</button>}>
        <span>centre</span>
      </AppBar>,
    );
    expect(container.querySelector(".t-appbar__brand")).toHaveTextContent("Crew");
    expect(container.querySelector(".t-appbar__title")).toHaveTextContent("Run 42running");
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    rerender(<AppBar title="Only" />);
    expect(container.querySelector(".t-appbar__brand")).toBeNull();
    expect(container.querySelector(".t-appbar__actions")).toBeNull();
    expect(container.querySelector(".t-appbar__title .t-meta")).toBeNull();
    rerender(<AppBar />);
    expect(container.querySelector(".t-appbar__title")).toBeNull();
  });
});

describe("LineChart axes", () => {
  it("keeps whole-number ticks and never crowds the last category label", () => {
    const categories = Array.from({ length: 10 }, (_, i) => `W${i}`);
    const { container } = render(
      <LineChart
        label="Weeks"
        categories={categories}
        series={[{ key: "a", label: "A", values: categories.map((_, i) => i + 2) }]}
        min={0}
        max={11}
      />,
    );
    const axis = [...container.querySelectorAll(".t-linechart__axis span")].map(
      (s) => s.textContent,
    );
    expect(axis).toEqual(["11", "6", "0"]);
    const x = [...container.querySelectorAll(".t-linechart__x span")].map((s) => s.textContent);
    expect(x).toEqual(["W0", "W2", "W4", "W6", "W9"]);
  });
});

describe("nested roving groups", () => {
  it("moves one step when swatches sit inside a toolbar", async () => {
    render(
      <Toolbar label="Note" style={{ left: 4 }}>
        <ColorSwatches
          label="Colour"
          value="a"
          options={[
            { value: "a", label: "A", color: "#fff" },
            { value: "b", label: "B", color: "#eee" },
            { value: "c", label: "C", color: "#ddd" },
          ]}
        />
        <IconButton icon="trash" label="Delete" />
      </Toolbar>,
    );
    expect(screen.getByRole("toolbar")).toHaveStyle({ left: "4px" });
    screen.getByRole("radio", { name: "A" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "B" })).toHaveFocus();
  });
});
