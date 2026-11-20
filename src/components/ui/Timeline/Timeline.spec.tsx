import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/Timeline/Timeline.spec.text";
import { render, screen } from "@testing-library/react";
import TimelineWithLogic, { Timeline } from ".";

function at(month: string, count: number) {
  return Array.from({ length: count }, () => ({ date: `${month}-15` }));
}

function columns(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-bucket]"));
}

describe("Unit tests for Timeline", () => {
  it("reports when nothing has a date", () => {
    render(
      <Timeline
        containerStyle={{}}
        plotStyle={{}}
        axisStyle={{}}
        captionStyle={{}}
        buckets={[]}
        caption=""
        emptyText={localized.text2}
      />,
    );
    expect(screen.getByText(localized.text3)).toBeInTheDocument();
  });
});

describe("Unit tests for withTimelineLogic", () => {
  it("draws months without events", () => {
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

  it("leaves empty months without blocks", () => {
    const { container } = render(
      <TimelineWithLogic
        events={[...at("2026-01", 2), ...at("2026-02", 0), ...at("2026-03", 1)]}
      />,
    );
    const block = columns(container)[1].querySelector("span");
    expect(block).toHaveStyle({ height: "0px" });
  });

  it("names each segment and its count", () => {
    const { container } = render(<TimelineWithLogic events={at("2026-03", 4)} unit="Records" />);
    expect(columns(container)[0]).toHaveAttribute("aria-label", localized.text7);
  });

  it("reports no additions for an empty month", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 1), ...at("2026-03", 1)]} />,
    );
    expect(columns(container)[1]).toHaveAttribute("aria-label", labelText.text457);
  });

  it("gives the busiest month full height", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 4), ...at("2026-02", 2)]} height={100} />,
    );
    const blocks = columns(container).map((column) => column.querySelector("span"));
    expect(blocks[0]).toHaveStyle({ height: "100px" });
    expect(blocks[1]).toHaveStyle({ height: "50px" });
  });

  it("keeps a single entry visible instead of rounding to zero", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 200), ...at("2026-02", 1)]} height={96} />,
    );
    const block = columns(container)[1].querySelector("span");
    expect(block).toHaveStyle({ height: "2px" });
  });

  it("shows the share beside the bar", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2025-11", 1), ...at("2026-02", 1)]} />,
    );

    expect(
      Array.from(container.querySelectorAll("[data-tick]")).map((tick) => tick.textContent),
    ).toEqual(["", "", "2026", ""]);
  });

  it("labels the start when space remains before the year boundary", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2025-08", 1), ...at("2026-01", 1)]} />,
    );
    expect(
      Array.from(container.querySelectorAll("[data-tick]")).map((tick) => tick.textContent),
    ).toEqual(["2025", "", "", "", "", "2026"]);
  });

  it("switches automatically to years beyond five years", () => {
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

  it("names the span and busiest segment", () => {
    const { container } = render(
      <TimelineWithLogic events={[...at("2026-01", 2), ...at("2026-03", 5)]} unit="Records" />,
    );
    expect(container).toHaveTextContent(localized.text14);
  });

  it("reports entries without dates", () => {
    const { container } = render(
      <TimelineWithLogic
        events={[...at("2026-01", 2), { date: "" }, { date: labelText.text458 }]}
      />,
    );
    expect(container).toHaveTextContent(localized.text16);
  });

  it("shows the quiet message when no event is dated", () => {
    render(<TimelineWithLogic events={[{ date: "" }]} emptyText={localized.text18} />);
    expect(screen.getByText(localized.text19)).toBeInTheDocument();
  });
});
