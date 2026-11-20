import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { stableIds } from "../../../../test/stableIds";
import RecordPickerWithLogic, { RecordPicker, withRecordPickerLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const items = [
  { id: "tasks/create/quick-add", label: "Quick add", kind: "Record", terms: ["core-tasks"] },
  { id: "sync/queue/offline-queue", label: "Offline queue", kind: "Record" },
  { id: "sync/queue/offline-queue", label: "poison-item-quarantine", kind: "Promise" },
];

describe("Unit tests for RecordPicker", () => {
  it("renders a search field with plain-text labelling", () => {
    render(
      <RecordPicker
        containerStyle={{}}
        inputStyle={{}}
        listStyle={{}}
        emptyStyle={{}}
        query=""
        placeholder="search …"
        results={[]}
        emptyText="Type to search."
        onQueryChange={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(
      screen.getByRole("combobox", { name: "Search records, promises, tests and code paths" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Type to search.")).toBeInTheDocument();
  });

  it("renders results as a listbox", () => {
    render(
      <RecordPicker
        containerStyle={{}}
        inputStyle={{}}
        listStyle={{}}
        emptyStyle={{}}
        query="quick"
        placeholder=""
        emptyText=""
        onQueryChange={jest.fn()}
        onKeyDown={jest.fn()}
        results={[
          {
            key: "a",
            label: "Quick add",
            kind: "Record",
            hint: "tasks/create/quick-add",
            active: true,
            onSelect: jest.fn(),
            rowStyle: {},
            labelStyle: {},
            kindStyle: {},
            hintStyle: {},
          },
        ]}
      />,
    );
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent("Quick add");
  });
});

describe("accessibility of RecordPicker", () => {
  it("points from the search field to the result list", () => {
    render(<RecordPickerWithLogic items={items} />);

    const input = screen.getByRole("combobox");
    const list = screen.getByRole("listbox");
    expect(input).toHaveAttribute("aria-controls", list.id);
    expect(list.id).toBeTruthy();
  });

  it("names the selected row while focus stays in the field", async () => {
    render(<RecordPickerWithLogic items={items} />);
    const input = screen.getByRole("combobox");

    const first = screen.getAllByRole("option")[0];
    expect(input).toHaveAttribute("aria-activedescendant", first.id);

    await userEvent.type(input, "{ArrowDown}");

    const second = screen.getAllByRole("option")[1];
    expect(input).toHaveAttribute("aria-activedescendant", second.id);
    // Focus does not move along: typing on must work without a detour.
    expect(input).toHaveFocus();
  });

  it("assigns ids that work as reference targets", () => {
    render(<RecordPickerWithLogic items={items} />);

    screen.getAllByRole("option").forEach((option) => {
      // A space in the id makes aria-activedescendant unresolvable —
      // the result key ("Record:Quick add:…") would have been exactly that.
      expect(option.id).not.toMatch(/\s/);
      expect(document.getElementById(option.id)).toBe(option);
    });
  });
});

describe("Unit tests for withRecordPickerLogic", () => {
  it("shows all entries initially", () => {
    const { container } = render(<RecordPickerWithLogic items={items} />);
    expect(container.querySelectorAll("[data-result]")).toHaveLength(3);
  });

  it("searches across label, id and additional terms", async () => {
    render(<RecordPickerWithLogic items={items} />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "core-tasks");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("Quick add");
  });

  it("requires all word parts", async () => {
    render(<RecordPickerWithLogic items={items} />);
    await userEvent.type(screen.getByRole("combobox"), "offline queue");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("selects with the arrow keys and opens with Enter", async () => {
    const onSelect = jest.fn();
    render(<RecordPickerWithLogic items={items} onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    input.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("sync/queue/offline-queue");
  });

  it("stops at the start and at the end of the list", async () => {
    render(<RecordPickerWithLogic items={items} />);
    screen.getByRole("combobox").focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(screen.getAllByRole("option")[2]).toHaveAttribute("aria-selected", "true");
  });

  it("jumps back to the first result on new input", async () => {
    render(<RecordPickerWithLogic items={items} />);
    const input = screen.getByRole("combobox");
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.type(input, "q");
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("opens on click too", async () => {
    const onSelect = jest.fn();
    render(<RecordPickerWithLogic items={items} onSelect={onSelect} />);
    await userEvent.click(screen.getAllByRole("option")[0]);
    expect(onSelect).toHaveBeenCalledWith("tasks/create/quick-add");
  });

  it("names where it searched when nothing matches", async () => {
    render(<RecordPickerWithLogic items={items} />);
    await userEvent.type(screen.getByRole("combobox"), "doesnotexist");
    expect(
      screen.getByText(/Nothing found for “doesnotexist” — neither record nor promise/),
    ).toBeInTheDocument();
  });

  it("limits the number of results", () => {
    const many = Array.from({ length: 40 }, (_, index) => ({
      id: `r-${index}`,
      label: `Record ${index}`,
      kind: "Record",
    }));
    const { container } = render(<RecordPickerWithLogic items={many} limit={5} />);
    expect(container.querySelectorAll("[data-result]")).toHaveLength(5);
  });

  it("takes focus on request", () => {
    // The search entry focuses its field — that is what is under test.
    // eslint-disable-next-line jsx-a11y/no-autofocus
    render(<RecordPickerWithLogic items={items} autoFocus />);
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("gives a meaningful displayName", () => {
    expect(withRecordPickerLogic(RecordPicker).displayName).toBe(
      "withRecordPickerLogic(RecordPicker)",
    );
  });
});

describe("corpus error as an inert result", () => {
  // A record whose YAML could not be read is missing from
  // `model.recs`/`model.byId` but appears in `model.corpusErrors`. Without this
  // case you search for it in the picker in vain, indistinguishable from it
  // never having existed. The caller marks such an entry with
  // `inert: true`; the picker shows it but does not open it like a
  // real record.
  const withError = [
    ...items,
    {
      id: "storage/uploads/batch-router.yaml",
      label: "storage/uploads/batch-router.yaml",
      kind: "Error",
      hint: "could not be read",
      inert: true,
    },
  ];

  it("shows a corpus error as an inert result when it is the only match", async () => {
    render(<RecordPickerWithLogic items={withError} />);
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("could not be read");
    // No `aria-disabled`: the row opens no detail, but on
    // click/Enter it calls `onSelectInert` — it is operable, just differently from
    // a real one. `aria-disabled` would tell a screen-reader user not
    // to even try, and that is exactly what they should do.
    expect(options[0]).not.toHaveAttribute("aria-disabled");
  });

  it("still shows the empty state when nothing matches", async () => {
    render(<RecordPickerWithLogic items={withError} />);
    await userEvent.type(screen.getByRole("combobox"), "doesnotexist");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(
      screen.getByText(/Nothing found for “doesnotexist” — neither record nor promise/),
    ).toBeInTheDocument();
  });

  it("shows a real record and a corpus error side by side, clearly distinguished", async () => {
    const mixed = [
      ...withError,
      {
        id: "storage/uploads/prepare-batch",
        label: "Prepare batch",
        kind: "Record",
        terms: ["batch-router"],
      },
    ];
    render(<RecordPickerWithLogic items={mixed} />);
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);

    const recordOption = options.find((option) => option.textContent?.includes("Prepare batch"));
    const errorOption = options.find((option) => option.textContent?.includes("could not be read"));
    // Both operable — only the text differs ("Error" / "could not
    // be read"), not the ARIA operability.
    expect(recordOption).not.toHaveAttribute("aria-disabled");
    expect(errorOption).not.toHaveAttribute("aria-disabled");
    expect(errorOption).toHaveTextContent("Error");
  });

  it("does not open the corpus error like a record on click, but calls onSelectInert", async () => {
    const onSelect = jest.fn();
    const onSelectInert = jest.fn();
    render(
      <RecordPickerWithLogic items={withError} onSelect={onSelect} onSelectInert={onSelectInert} />,
    );
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    await userEvent.click(screen.getByRole("option"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectInert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "storage/uploads/batch-router.yaml" }),
    );
  });

  it("also calls onSelectInert instead of onSelect on Enter on the active corpus error", async () => {
    const onSelect = jest.fn();
    const onSelectInert = jest.fn();
    render(
      <RecordPickerWithLogic items={withError} onSelect={onSelect} onSelectInert={onSelectInert} />,
    );
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "batch-router");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectInert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "storage/uploads/batch-router.yaml" }),
    );
  });

  it("does nothing on click when no onSelectInert was passed", async () => {
    const onSelect = jest.fn();
    render(<RecordPickerWithLogic items={withError} onSelect={onSelect} />);
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    await userEvent.click(screen.getByRole("option"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("survives the result cut-off (`limit`) even when many records match too", async () => {
    // A record is still reachable through register, graph and focus list
    // when it drops out of the result list here — a skipped record
    // ONLY here and in "Validation". So it must survive even when the
    // number of matching real results alone would fill the limit.
    const manyMatches = Array.from({ length: 5 }, (_, n) => ({
      id: `storage/uploads/other-${n}`,
      label: `Sibling ${n}`,
      kind: "Record",
      hint: "batch-router-neighbour",
    }));
    const items = [
      {
        id: "storage/uploads/batch-router.yaml",
        label: "storage/uploads/batch-router.yaml",
        kind: "Error",
        hint: "could not be read",
        inert: true,
      },
      ...manyMatches,
    ];
    render(<RecordPickerWithLogic items={items} limit={2} />);
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("could not be read");
  });
});

describe("accessibility of inert results in RecordPicker", () => {
  // `aria-disabled="true"` claims "not operable" — but an inert result
  // IS operable (click/Enter call `onSelectInert`), just differently from
  // a real one. The attribute would talk a screen-reader user out of exactly
  // the interaction this row is meant to enable; the distinction
  // lives in the text itself instead (`kind`/`hint`).
  it("does NOT mark an inert result as aria-disabled", () => {
    render(
      <RecordPicker
        containerStyle={{}}
        inputStyle={{}}
        listStyle={{}}
        emptyStyle={{}}
        query="error"
        placeholder=""
        emptyText=""
        onQueryChange={jest.fn()}
        onKeyDown={jest.fn()}
        results={[
          {
            key: "err",
            label: "storage/uploads/batch-router.yaml",
            kind: "Error",
            hint: "could not be read",
            active: false,
            inert: true,
            onSelect: jest.fn(),
            rowStyle: {},
            labelStyle: {},
            kindStyle: {},
            hintStyle: {},
          },
        ]}
      />,
    );
    const option = screen.getByRole("option");
    expect(option).not.toHaveAttribute("aria-disabled");
    expect(option).toHaveTextContent("Error");
    expect(option).toHaveTextContent("could not be read");
  });

  it("leaves a real result without aria-disabled", () => {
    render(
      <RecordPicker
        containerStyle={{}}
        inputStyle={{}}
        listStyle={{}}
        emptyStyle={{}}
        query="quick"
        placeholder=""
        emptyText=""
        onQueryChange={jest.fn()}
        onKeyDown={jest.fn()}
        results={[
          {
            key: "a",
            label: "Quick add",
            kind: "Record",
            hint: "tasks/create/quick-add",
            active: true,
            onSelect: jest.fn(),
            rowStyle: {},
            labelStyle: {},
            kindStyle: {},
            hintStyle: {},
          },
        ]}
      />,
    );
    expect(screen.getByRole("option")).not.toHaveAttribute("aria-disabled");
  });
});

describe("row height prevents clipped rows (reported bug: row clipped at the bottom)", () => {
  // Reported bug: in search (⌘K), with results that fill the list,
  // the last visible row is clipped at the bottom — not the
  // usual sideways "…" truncation, but a vertical cut through the middle of the
  // text. Cause: every row has two lines (label+kind, below it the
  // placement `hint`, which via `gridColumn: "1 / -1"` falls onto its own
  // grid row), but only had a `minHeight` — its actual
  // height stayed variable, unrelated to the fixed `listStyle.maxHeight` (360)
  // at which the list clips via `overflowY: "auto"`. As soon as more results
  // appeared than whole rows fit exactly, the scroll edge fell
  // in the middle of the last row.
  const many = Array.from({ length: 3 }, (_, index) => ({
    id: `r-${index}`,
    label: `Record ${index}`,
    kind: "Record",
    hint: `hint-${index}`,
  }));

  it("sets a fixed row height instead of a mere minimum", () => {
    const { container } = render(<RecordPickerWithLogic items={many} />);
    const rows = container.querySelectorAll<HTMLElement>("[data-result]");
    expect(rows.length).toBe(3);
    rows.forEach((row) => {
      // `minHeight` alone lets the row grow without the list knowing
      // about it — so a real, declared height must be set. Not
      // checked is that `minHeight` is absent: a future rework that sets
      // both would not be a relapse into the reported bug.
      expect(row.style.height).not.toBe("");
      expect(Number.parseFloat(row.style.height)).toBeGreaterThan(0);
    });
  });

  it("computes the row height from everything actually in the row — not just from the font's line heights", () => {
    // `rowStyle` carries `gap: 10` — the grid shorthand
    // sets not only the gap between the label and kind columns,
    // but also the row gap to the hint row below (which via
    // `gridColumn: "1 / -1"` falls onto its own grid row). The first
    // version of `ROW_HEIGHT` counted label + hint + padding,
    // but not this row gap — the row stayed 10px too short, and exactly
    // the reported bug (text clipped at the bottom) kept occurring.
    // Comparing `listMaxHeight % rowHeight` alone would never have
    // caught that: both numbers come from the same formula and
    // necessarily agree, however wrong the formula itself is. This
    // check therefore recomputes the expected height independently, from the
    // actual parts of a row: 18px label line + 10px
    // row gap + 14px hint line + 16px padding (8px top, 8px bottom).
    const EXPECTED_ROW_HEIGHT = 18 + 10 + 14 + 16;
    const VISIBLE_ROWS = 7;

    const { container } = render(<RecordPickerWithLogic items={many} />);
    const list = screen.getByRole("listbox");
    const row = container.querySelector<HTMLElement>("[data-result]")!;

    expect(Number.parseFloat(row.style.height)).toBe(EXPECTED_ROW_HEIGHT);
    expect(Number.parseFloat(list.style.maxHeight)).toBe(EXPECTED_ROW_HEIGHT * VISIBLE_ROWS);
    // `box-sizing: border-box` holds only because `tokens.css` sets it globally —
    // without that stylesheet `height` would not include the padding, and
    // the row would grow beyond its own declared height. The row
    // secures this itself instead of relying on an externally included
    // stylesheet.
    expect(row.style.boxSizing).toBe("border-box");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", async () => {
    renderInGerman(<RecordPickerWithLogic items={[]} />);
    expect(
      screen.getByRole("combobox", { name: germanText.t("elements.recordPicker.searchLabel") }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(germanText.t("elements.recordPicker.placeholder")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(germanText.t("elements.recordPicker.typeToSearch")),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByRole("combobox"), "doesnotexist");
    expect(
      screen.getByText(germanText.t("elements.recordPicker.noMatchFor", { query: "doesnotexist" })),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for RecordPicker", () => {
  it("with results", () => {
    const { container } = render(<RecordPickerWithLogic items={items} />);
    expect(stableIds(container.firstChild as HTMLElement)).toMatchSnapshot();
  });

  it("without entries", () => {
    const { container } = render(<RecordPickerWithLogic items={[]} />);
    expect(stableIds(container.firstChild as HTMLElement)).toMatchSnapshot();
  });
});
