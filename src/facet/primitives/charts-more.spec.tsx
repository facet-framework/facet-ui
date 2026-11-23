import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BandChart, BarChart } from "./charts";
import { Pyramid, ShareBar, Sunburst, Treemap, categoryColor, layoutTreemap } from "./proportion";
import { CalendarHeatmap, DateHistogram, bucketEvents } from "./time";
import { RingMeter } from "./meters";
import { renderInGerman } from "../i18n/testing";
import { de } from "../i18n";

describe("BarChart meta column", () => {
  it("adds a quiet fourth column only when a bar carries meta", () => {
    const { container, rerender } = render(
      <BarChart
        label="Areas"
        bars={[
          { key: "a", label: "Checkout", value: 3, meta: "owner: pay" },
          { key: "b", label: "Search", value: 1 },
        ]}
      />,
    );
    expect(container.querySelector(".t-bars")).toHaveClass("t-bars--meta");
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Checkout3owner: pay");
    expect(rows[1].querySelector(".t-bars__meta")).toBeEmptyDOMElement();
    rerender(<BarChart label="Areas" bars={[{ key: "a", label: "Checkout", value: 3 }]} />);
    expect(container.querySelector(".t-bars__meta")).toBeNull();
  });
});

describe("BandChart", () => {
  it("names the span and median and marks samples outside the target band", () => {
    const { container } = render(
      <BandChart
        label="Lines per record"
        min={10}
        max={300}
        median={80}
        band={{ low: 20, high: 120 }}
        values={[10, 50, 300]}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Lines per record: min 10 · median 80 · max 300" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".t-band__dot")).toHaveLength(3);
    expect(container.querySelectorAll(".t-band__dot--out")).toHaveLength(2);
    expect(container.querySelector(".t-band__median")).not.toBeNull();
    expect(container.querySelector(".t-band__target")).not.toBeNull();
  });

  it("says not measured instead of drawing a span at zero", () => {
    const { container } = render(<BandChart label="Size" min={null} max={null} median={null} />);
    const chart = screen.getByRole("img", { name: "Size: not measured" });
    expect(chart).toHaveAttribute("data-state", "unmeasured");
    expect(container.querySelector(".t-band__span")).toBeNull();
    expect(container.querySelector(".t-band__median")).toBeNull();
    expect(container.querySelector(".t-band__none")).not.toBeNull();
  });

  it("writes a missing end as a dash when only the median is known", () => {
    render(<BandChart label="Age" min={null} max={null} median={4} />);
    expect(screen.getByRole("img", { name: "Age: min – · median 4 · max –" })).toBeInTheDocument();
  });
});

describe("CalendarHeatmap", () => {
  const days = [
    { date: "2026-03-02", count: 4 },
    { date: "2026-03-04", count: 1 },
    { date: "2026-03-05", count: null },
  ];

  it("fills a gapless grid, counts unlisted days as zero and outlines unmeasured ones", () => {
    const { container } = render(
      <CalendarHeatmap label="Commits" days={days} from="2026-03-02" to="2026-03-08" />,
    );
    expect(
      screen.getByRole("img", { name: "Commits: 5 on 2 days · 1 days not measured" }),
    ).toBeInTheDocument();
    const cells = container.querySelectorAll("rect.t-cal__day");
    expect(cells).toHaveLength(7);
    const unmeasured = container.querySelector('rect[data-date="2026-03-05"]')!;
    expect(unmeasured).toHaveClass("t-cal__day--unmeasured");
    expect((unmeasured as SVGElement).style.fill).toBe("");
    expect(unmeasured.querySelector("title")).toHaveTextContent("2026-03-05: not measured");
    const empty = container.querySelector('rect[data-date="2026-03-03"]')!;
    expect(empty.querySelector("title")).toHaveTextContent("2026-03-03: 0");
    expect((empty as SVGElement).style.fill).toBe("");
    const busiest = container.querySelector('rect[data-date="2026-03-02"]')!;
    expect((busiest as SVGElement).style.fill).toContain("100%");
  });

  it("offers the busiest days as toggle buttons when days can be picked", async () => {
    const pick = jest.fn();
    render(
      <CalendarHeatmap
        label="Commits"
        days={days}
        from="2026-03-02"
        to="2026-03-08"
        selected="2026-03-04"
        onPick={pick}
      />,
    );
    const group = screen.getByRole("group", { name: "Busiest days" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["2026-03-024", "2026-03-041"]);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(buttons[0]);
    expect(pick).toHaveBeenCalledWith("2026-03-02");
  });

  it("names months and weekdays in the active language", () => {
    const { container } = renderInGerman(
      <CalendarHeatmap label="Commits" days={[]} from="2026-02-10" to="2026-04-10" />,
    );
    const labels = [...container.querySelectorAll("text")].map((t) => t.textContent);
    const month = new Intl.DateTimeFormat("de", { month: "short", timeZone: "UTC" });
    const weekday = new Intl.DateTimeFormat("de", { weekday: "short", timeZone: "UTC" });
    expect(labels).toEqual(
      expect.arrayContaining([
        month.format(new Date(Date.UTC(2026, 2, 1))),
        // 2024-01-01 was a Monday.
        weekday.format(new Date(Date.UTC(2024, 0, 1))),
        weekday.format(new Date(Date.UTC(2024, 0, 5))),
      ]),
    );
    expect(labels).not.toContain("Mar");
    expect(screen.getByText(de["primitives.calendar.less"])).toBeInTheDocument();
  });
});

describe("DateHistogram", () => {
  it("counts into a gapless run of months and names each column with its count", () => {
    render(
      <DateHistogram
        label="Records per month"
        unit="records"
        events={[
          { date: "2025-11-03" },
          { date: "2025-11-20" },
          { date: "2026-01" },
          { date: "someday" },
        ]}
      />,
    );
    const list = screen.getByRole("list", { name: "Records per month" });
    const columns = within(list).getAllByRole("listitem");
    expect(columns.map((c) => c.textContent)).toEqual([
      "November 2025 · 2 records",
      "December 2025 · none",
      "January 2026 · 1 records",
    ]);
    expect(columns[1].querySelector<HTMLElement>(".t-hist__block")!.style.height).toBe("0px");
    expect(
      screen.getByText(
        "3 records · November 2025 to January 2026 · most in November 2025 (2) · 1 without a date",
      ),
    ).toBeInTheDocument();
  });

  it("labels only year turns and switches to years over long spans", () => {
    const { buckets, mode } = bucketEvents([{ date: "2015-01-01" }, { date: "2026-01-01" }]);
    expect(mode).toBe("year");
    expect(buckets).toHaveLength(12);
    const { container } = render(
      <DateHistogram label="Per month" events={[{ date: "2025-12-01" }, { date: "2026-02-01" }]} />,
    );
    const ticks = [...container.querySelectorAll("[data-tick]")].map((t) => t.textContent);
    expect(ticks).toEqual(["", "2026", ""]);
  });

  it("says so when no event carries a date", () => {
    render(<DateHistogram label="Per month" events={[{ date: "" }]} />);
    expect(screen.getByText("No dated events")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("RingMeter", () => {
  it("is a meter whose arc is the share of the full ring", () => {
    const { container } = render(<RingMeter label="Scenarios with a test" value={0.5} />);
    const meter = screen.getByRole("meter", { name: "Scenarios with a test" });
    expect(meter).toHaveAttribute("aria-valuenow", "50");
    expect(meter).toHaveAttribute("aria-valuetext", "50%");
    expect(meter).toHaveTextContent("50%");
    const arc = container.querySelector(".t-ring__value")!;
    const [dash, gap] = arc.getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(dash).toBeCloseTo(gap, 1);
  });

  it("shows a dash and names an unmeasured share, never zero", () => {
    const { container } = render(<RingMeter label="Coverage" value={null} />);
    const meter = screen.getByRole("meter", { name: "Coverage" });
    expect(meter).not.toHaveAttribute("aria-valuenow");
    expect(meter).toHaveAttribute("aria-valuetext", "not measured");
    expect(meter).toHaveTextContent("—");
    expect(meter).toHaveClass("t-ring--unmeasured");
    expect(container.querySelector(".t-ring__value")).toBeNull();
  });

  it("takes caller words for the value and the display", () => {
    render(<RingMeter label="Tests" value={31 / 38} valueText="31 of 38" display="31" tone="ok" />);
    const meter = screen.getByRole("meter", { name: "Tests" });
    expect(meter).toHaveAttribute("aria-valuetext", "31 of 38");
    expect(meter).toHaveTextContent("31");
  });
});

describe("Sunburst", () => {
  const nodes = [
    {
      key: "pay",
      label: "Payments",
      value: 6,
      children: [
        { key: "pay.card", label: "Card", value: 4 },
        { key: "pay.bank", label: "Bank", value: 2 },
      ],
    },
    { key: "search", label: "Search", value: 2 },
  ];

  it("keys the inner ring visibly and lists every child for screen readers", () => {
    const { container } = render(<Sunburst label="Features by area" nodes={nodes} />);
    const figure = screen.getByRole("figure", { name: "Features by area" });
    const items = within(figure)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(items).toEqual(["Payments6Card: 4Bank: 2", "Card: 4", "Bank: 2", "Search2"]);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("path")).toHaveLength(4);
  });

  it("falls back to a list for screen readers only without the key", () => {
    const { container } = render(<Sunburst label="Areas" nodes={nodes} legend={false} />);
    expect(container.querySelector(".t-sun__legend")).toBeNull();
    const items = within(screen.getByRole("figure", { name: "Areas" }))
      .getAllByRole("listitem")
      .map((li) => li.firstChild?.textContent);
    expect(items).toEqual(["Payments: 6", "Card: 4", "Bank: 2", "Search: 2"]);
  });

  it("dims what is not selected and draws an empty ring for a zero total", () => {
    const { container, rerender } = render(
      <Sunburst label="Areas" nodes={nodes} selected="pay.card" center={<b>8</b>} />,
    );
    expect(container.querySelector('[data-key="search"]')).toHaveAttribute("opacity", "0.45");
    expect(container.querySelector('[data-key="pay"]')).toHaveAttribute("opacity", "1");
    expect(container.querySelector('[data-key="pay.bank"]')).toHaveAttribute("opacity", "0.4");
    expect(screen.getByText("8")).toBeInTheDocument();
    rerender(<Sunburst label="Areas" nodes={[{ key: "a", label: "A", value: 0 }]} />);
    expect(container.querySelector(".t-sun__empty")).not.toBeNull();
    expect(container.querySelector("path")).toBeNull();
  });

  it("labels an arc only with its whole label and leaves the rest to the list", () => {
    const { container } = render(
      <Sunburst
        label="Areas"
        size={360}
        nodes={[
          { key: "pay", label: "Payments", value: 40 },
          { key: "seo", label: "Search engine optimisation", value: 1 },
        ]}
      />,
    );
    const drawn = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(drawn).toEqual(["Payments"]);
    expect(screen.getByText("Search engine optimisation")).toBeVisible();
    expect(drawn.join("")).not.toContain("…");
    expect(container.querySelector('[data-key="seo"] title')).toHaveTextContent(
      "Search engine optimisation: 1",
    );
  });

  it("colours categories past the fourth with mixes, never a repeat of the first", () => {
    expect(categoryColor(0)).toBe("var(--t-series-1)");
    expect(categoryColor(4)).toContain("var(--t-series-1) 55%, var(--t-series-2)");
    expect(categoryColor(4)).not.toBe(categoryColor(0));
  });
});

describe("Treemap", () => {
  it("splits areas in proportion to their values", () => {
    const cells = layoutTreemap(
      [
        { key: "a", value: 2 },
        { key: "b", value: 1 },
        { key: "c", value: 1 },
      ],
      { x: 0, y: 0, w: 100, h: 50 },
    );
    expect(cells.map((c) => c.w * c.h)).toEqual([2500, 1250, 1250]);
  });

  it("names each cell and makes it a toggle only when cells can be picked", async () => {
    const pick = jest.fn();
    const items = [
      { key: "a", label: "checkout", value: 3, sub: "2 files" },
      { key: "b", label: "search", value: 1 },
      { key: "z", label: "empty", value: 0 },
    ];
    const { rerender } = render(<Treemap label="Files" items={items} />);
    const list = screen.getByRole("list", { name: "Files" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("checkout: 3")).toBeInTheDocument();
    rerender(<Treemap label="Files" items={items} selected="b" onPick={pick} />);
    expect(screen.getByRole("button", { name: "search: 1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "checkout: 3" }));
    expect(pick).toHaveBeenCalledWith("a");
  });
});

describe("Pyramid", () => {
  const layers = [
    { key: "e2e", label: "End to end", value: 1 },
    { key: "int", label: "Integration", value: 3, meta: "slow" },
    { key: "unit", label: "Unit", value: 6 },
  ];

  it("writes each layer's count and share and widens towards the base", () => {
    render(<Pyramid label="Tests" layers={layers} />);
    const rows = within(screen.getByRole("list", { name: "Tests" })).getAllByRole("listitem");
    expect(rows.map((r) => r.textContent)).toEqual([
      "End to end110%",
      "Integration330% · slow",
      "Unit660%",
    ]);
    expect(screen.queryByRole("button")).toBeNull();
    const width = (r: HTMLElement) =>
      parseFloat(
        (r.firstChild as HTMLElement).style.getPropertyValue("--t-pyramid-w").replace("%", ""),
      );
    expect(width(rows[0])).toBeLessThan(width(rows[2]));
  });

  it("shows no share without a denominator and picks a layer when asked", async () => {
    const pick = jest.fn();
    render(
      <Pyramid
        label="Tests"
        layers={[{ key: "unit", label: "Unit", value: 0 }]}
        selected="unit"
        onPick={pick}
      />,
    );
    const button = screen.getByRole("button", { name: /Unit/ });
    expect(button).toHaveTextContent(/^Unit0$/);
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    expect(pick).toHaveBeenCalledWith("unit");
  });
});

describe("ShareBar", () => {
  it("names its labelled parts and draws one segment per non-empty part", () => {
    const { container } = render(
      <ShareBar
        label="Scenarios"
        parts={[
          { key: "ok", value: 3, tone: "ok", label: "tested" },
          { key: "no", value: 1, tone: "warn", label: "untested" },
          { key: "skip", value: 0, label: "skipped" },
        ]}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Scenarios: tested 3, untested 1, skipped 0" }),
    ).toBeInTheDocument();
    const segs = container.querySelectorAll<HTMLElement>(".t-share > span");
    expect(segs).toHaveLength(2);
    expect(segs[0].style.background).toBe("var(--t-ok)");
  });

  it("is named none and draws an empty track for a zero whole", () => {
    const { container } = render(<ShareBar label="Scenarios" parts={[{ key: "a", value: 0 }]} />);
    expect(screen.getByRole("img", { name: "Scenarios: none" })).toHaveClass("t-share--empty");
    expect(container.querySelectorAll(".t-share > span")).toHaveLength(0);
  });

  it("keeps the caller's name when no part is labelled", () => {
    render(<ShareBar label="Mix" parts={[{ key: "a", value: 2 }]} />);
    expect(screen.getByRole("img", { name: "Mix" })).toBeInTheDocument();
  });
});
