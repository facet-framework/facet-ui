import { createText as createGermanText } from "../../../facet/i18n/text";
const monthName = (month: number) =>
  new Intl.DateTimeFormat("de", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, month - 1, 1)),
  );
import { render, screen } from "@testing-library/react";
import TimelineWithLogic, { Timeline } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

/** Creates `count` events in the given month. */
function at(month: string, count: number) {
  return Array.from({ length: count }, () => ({ date: `${month}-15` }));
}

function columns(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-bucket]"));
}

describe("Unit tests for Timeline", () => {
  it("says so when nothing is dated", () => {
    render(
      <Timeline
        containerStyle={{}}
        plotStyle={{}}
        axisStyle={{}}
        captionStyle={{}}
        buckets={[]}
        caption=""
        emptyText="Nothing is dated."
      />,
    );
    expect(screen.getByText("Nothing is dated.")).toBeInTheDocument();
  });
});

describe("Unit tests for withTimelineLogic", () => {
  it("also draws the months without an event", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 2), ...at("2026-04", 1)]} />,
    );
    expect(columns(container).map((column) => column.getAttribute("data-bucket"))).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
    ]);
  });

  it("leaves an empty month standing without a block", () => {
    const { container } = render(
      <TimelineWithLogic
        events={[...at("2026-01", 2), ...at("2026-02", 0), ...at("2026-03", 1)]}
      />,
    );
    const block = columns(container)[1].querySelector("span");
    expect(block).toHaveStyle({ height: "0px" });
  });

  it("names every section with name and number", () => {
    const { container } = render(<TimelineWithLogic events={at("2026-03", 4)} unit="Records" />);
    expect(columns(container)[0]).toHaveAttribute("aria-label", "March 2026 · 4 Records");
  });

  it("says for an empty month that nothing was created", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 1), ...at("2026-03", 1)]} />,
    );
    expect(columns(container)[1]).toHaveAttribute("aria-label", "February 2026 · nothing created");
  });

  it("gives the largest month the full height", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 4), ...at("2026-02", 2)]} height={100} />,
    );
    const blocks = columns(container).map((column) => column.querySelector("span"));
    expect(blocks[0]).toHaveStyle({ height: "100px" });
    expect(blocks[1]).toHaveStyle({ height: "50px" });
  });

  it("keeps a single entry visible instead of rounding it to zero", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 200), ...at("2026-02", 1)]} height={96} />,
    );
    const block = columns(container)[1].querySelector("span");
    expect(block).toHaveStyle({ height: "2px" });
  });

  it("labels the turn of the year", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2025-11", 1), ...at("2026-02", 1)]} />,
    );
    // November, December, January, February — the label sits on January.
    // The first section stays unlabelled: two columns further on the next
    // number already stands, and two numbers on two columns overlap.
    expect(
      Array.from(container.querySelectorAll("[data-tick]")).map((tick) => tick.textContent),
    ).toEqual(["", "", "2026", ""]);
  });

  it("labels the start as soon as there is room up to the turn of the year", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2025-08", 1), ...at("2026-01", 1)]} />,
    );
    expect(
      Array.from(container.querySelectorAll("[data-tick]")).map((tick) => tick.textContent),
    ).toEqual(["2025", "", "", "", "", "2026"]);
  });

  it("switches to years on its own beyond five years", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2020-01", 3), ...at("2026-01", 5)]} />,
    );
    expect(columns(container).map((column) => column.getAttribute("data-bucket"))).toEqual([
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
  });

  it("names the span and the densest section", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 2), ...at("2026-03", 5)]} unit="Records" />,
    );
    expect(container).toHaveTextContent(
      "7 Records · January 2026 to March 2026 · densest period March 2026 with 5",
    );
  });

  it("does not hide what has no date", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 2), { date: "" }, { date: "sometime" }]} />,
    );
    expect(container).toHaveTextContent("2 without a date, not drawn");
  });

  it("names the span, the unit and the months in German under the German locale", () => {
    const { container } = renderInGerman(
      <TimelineWithLogic events={[...at("2026-01", 2), ...at("2026-03", 5)]} />,
    );
    expect(container).toHaveTextContent(
      `7 Records · ${germanText.t("elements.timeline.range", { first: `${monthName(1)} 2026`, last: `${monthName(3)} 2026` })} · ${germanText.t("elements.timeline.peak", { name: `${monthName(3)} 2026`, count: 5 })}`,
    );
    expect(columns(container)[1]).toHaveAttribute(
      "aria-label",
      `${monthName(2)} 2026 · ${germanText.t("elements.timeline.nothingCreated")}`,
    );
  });

  it("falls back to the English unit and month names", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 2), ...at("2026-03", 5)]} />,
    );
    expect(container).toHaveTextContent(
      "7 records · January 2026 to March 2026 · densest period March 2026 with 5",
    );
  });

  it("shows the quiet sentence when no event carries a date", () => {
    render(<TimelineWithLogic events={[{ date: "" }]} emptyText="No creation date." />);
    expect(screen.getByText("No creation date.")).toBeInTheDocument();
  });
});
