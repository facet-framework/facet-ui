import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/d-plugins/createAndMobile.spec.text";
/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["expect", "expectDisabledWithReason"] }] */
import { fireEvent, screen, within } from "@testing-library/react";
import { renderInGerman as render } from "../../i18n/testing";
import { AdrCollection, AdrEmpty } from "./Adr";
import { ProcessWorkspace } from "./Processes";
import { GlossaryPage } from "../c-contents/Glossary";
import * as D from "../c-contents/data";
import * as data from "./storyData";

const REASON = localized.text1;

function expectDisabledWithReason(name: string, onCreate: jest.Mock) {
  const button = screen.getByRole("button", { name });
  expect(button).toHaveAttribute("aria-disabled", "true");
  expect(button).toHaveAccessibleDescription(REASON);

  expect(screen.getAllByText(REASON).length).toBeGreaterThan(0);
  fireEvent.click(button);
  expect(onCreate).not.toHaveBeenCalled();
}

describe("create actions disabled with a reason", () => {
  const counts = data.adrCounts(data.adrs480);
  const adrBase = { total: 480, counts, page: 1, pageSize: 60, query: "", directory: "docs/adr" };

  it("AdrCollection keeps the create button and says why it is unavailable", () => {
    const onCreate = jest.fn();
    render(
      <AdrCollection
        state="ready"
        view="table"
        items={data.adrs480.slice(0, 5)}
        {...adrBase}
        onCreate={onCreate}
        createDisabledReason={REASON}
      />,
    );
    expectDisabledWithReason(labelText.text81, onCreate);
  });

  it("AdrCollection without a reason creates as before", () => {
    const onCreate = jest.fn();
    render(
      <AdrCollection
        state="ready"
        view="table"
        items={data.adrs480.slice(0, 5)}
        {...adrBase}
        onCreate={onCreate}
      />,
    );
    const button = screen.getByRole("button", { name: labelText.text81 });
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(button).not.toHaveAccessibleDescription();
    fireEvent.click(button);
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("AdrEmpty passes the reason to both create buttons", () => {
    const onCreate = jest.fn();
    render(<AdrEmpty directory="docs/adr" onCreate={onCreate} createDisabledReason={REASON} />);
    expectDisabledWithReason(remainingText.text86, onCreate);
    expectDisabledWithReason(labelText.text81, onCreate);
  });

  it("GlossaryPage disables proposing with a reason, in the list and in the empty state", () => {
    const onPropose = jest.fn();
    const base = {
      terms: D.glossary40,
      letters: D.lettersOf(D.glossary40),
      query: "",
      page: 1,
      pageSize: 50,
      total: D.glossary40.length,
      categories: D.glossaryCategories,
      onPropose,
      proposeDisabledReason: REASON,
    };
    const { rerender } = render(<GlossaryPage {...base} state="ready" />);
    expectDisabledWithReason(germanLabels.text39, onPropose);
    rerender(<GlossaryPage {...base} state="empty" terms={[]} total={0} />);
    expectDisabledWithReason(germanLabels.text40, onPropose);
  });
});

describe("mobile: every button has a name", () => {
  it("the mobile ADR collection has no unnamed button, and the directory button is named", () => {
    const onSettings = jest.fn();
    render(
      <AdrCollection
        state="ready"
        view="timeline"
        items={data.adrs480.slice(0, 20)}
        total={480}
        counts={data.adrCounts(data.adrs480)}
        page={1}
        pageSize={60}
        query=""
        directory="docs/adr"
        mobile
        onSettings={onSettings}
      />,
    );

    expect(screen.getAllByRole("button").length).toBeGreaterThan(5);
    expect(screen.queryAllByRole("button", { name: "" })).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: labelText.text82 }));
    expect(onSettings).toHaveBeenCalled();
  });
});

describe("mobile process workspace", () => {
  const props = {
    name: labelText.text83,
    file: "a.bpmn",
    diagram: data.diagram,
    metrics: { elements: 12, flows: 15, lanes: 3, paths: 2, longest: 6 },
    panel: "detail" as const,
    findings: [],
    outlineQuery: "",
    zoom: 80,
    linked: {},
    mobile: true,
  };

  it("keeps the zoom buttons reachable", () => {
    const onZoom = jest.fn();
    render(<ProcessWorkspace {...props} onZoom={onZoom} />);
    const bar = screen.getByRole("toolbar", { name: "Zoom" });
    expect(within(bar).getByTestId("zoom")).toHaveTextContent("80");
    fireEvent.click(within(bar).getByRole("button", { name: localized.text3 }));
    fireEvent.click(within(bar).getByRole("button", { name: labelText.text84 }));
    fireEvent.click(within(bar).getByRole("button", { name: labelText.text85 }));
    expect(onZoom.mock.calls).toEqual([["in"], ["out"], ["fit"]]);
  });

  it("shows all five stats, paths and longest path included", () => {
    render(<ProcessWorkspace {...props} />);
    const stats = within(screen.getByTestId("process-mobile-stats")).getAllByRole("listitem");
    expect(stats.map((s) => s.textContent)).toEqual([
      "12 Elemente",
      localized.text4,
      "3 Bahnen",
      labelText.text86,
      localized.text5,
    ]);
  });

  it("marks unmeasured path counts with a dash", () => {
    render(
      <ProcessWorkspace {...props} metrics={{ ...props.metrics, paths: null, longest: null }} />,
    );
    const stats = within(screen.getByTestId("process-mobile-stats")).getAllByRole("listitem");
    expect(stats[3]).toHaveTextContent(labelText.text87);
    expect(stats[4]).toHaveTextContent(localized.text6);
  });
});
