import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/RecordPicker/RecordPicker.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { stableIds } from "../../../../test/stableIds";
import RecordPickerWithLogic, { RecordPicker, withRecordPickerLogic } from ".";

const items = [
  { id: "tasks/create/quick-add", label: "Quick add", kind: "Record", terms: ["core-tasks"] },
  { id: "sync/queue/offline-queue", label: "Offline queue", kind: "Record" },
  { id: "sync/queue/offline-queue", label: "poison-item-quarantine", kind: germanLabels.text23 },
];

describe("Unit tests for RecordPicker", () => {
  it("renders an accessible search field", () => {
    render(
      <RecordPicker
        containerStyle={{}}
        inputStyle={{}}
        listStyle={{}}
        emptyStyle={{}}
        query=""
        placeholder={remainingText.text131}
        results={[]}
        emptyText={germanLabels.text162}
        onQueryChange={jest.fn()}
        onKeyDown={jest.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: localized.text2 })).toBeInTheDocument();
    expect(screen.getByText(germanLabels.text162)).toBeInTheDocument();
  });

  it("empty", () => {
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

describe("RecordPicker accessibility", () => {
  it("associates the search field with its result list", () => {
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

    expect(input).toHaveFocus();
  });

  it("creates identifiers suitable for reference targets", () => {
    render(<RecordPickerWithLogic items={items} />);

    screen.getAllByRole("option").forEach((option) => {
      expect(option.id).not.toMatch(/\s/);
      expect(document.getElementById(option.id)).toBe(option);
    });
  });
});

describe("Unit tests for withRecordPickerLogic", () => {
  it("initially shows all entries", () => {
    const { container } = render(<RecordPickerWithLogic items={items} />);
    expect(container.querySelectorAll("[data-result]")).toHaveLength(3);
  });

  it("searches labels, identifiers and additional terms", async () => {
    render(<RecordPickerWithLogic items={items} />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "core-tasks");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("Quick add");
  });

  it("requires every word part", async () => {
    render(<RecordPickerWithLogic items={items} />);
    await userEvent.type(screen.getByRole("combobox"), "offline queue");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("selects with arrow keys and opens with Enter", async () => {
    const onSelect = jest.fn();
    render(<RecordPickerWithLogic items={items} onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    input.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("sync/queue/offline-queue");
  });

  it("stops at the first and last result", async () => {
    render(<RecordPickerWithLogic items={items} />);
    screen.getByRole("combobox").focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(screen.getAllByRole("option")[2]).toHaveAttribute("aria-selected", "true");
  });

  it("returns to the first match when the query changes", async () => {
    render(<RecordPickerWithLogic items={items} />);
    const input = screen.getByRole("combobox");
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.type(input, "q");
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("also opens on click", async () => {
    const onSelect = jest.fn();
    render(<RecordPickerWithLogic items={items} onSelect={onSelect} />);
    await userEvent.click(screen.getAllByRole("option")[0]);
    expect(onSelect).toHaveBeenCalledWith("tasks/create/quick-add");
  });

  it("calculates the percentage", async () => {
    render(<RecordPickerWithLogic items={items} />);
    await userEvent.type(screen.getByRole("combobox"), labelText.extra27);
    expect(screen.getByText(localized.text12)).toBeInTheDocument();
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

  it("optionally takes focus", () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus
    render(<RecordPickerWithLogic items={items} autoFocus />);
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("sets a descriptive displayName", () => {
    expect(withRecordPickerLogic(RecordPicker).displayName).toBe(
      "withRecordPickerLogic(RecordPicker)",
    );
  });
});

describe("Corpus error as an inert result", () => {
  const withError = [
    ...items,
    {
      id: "storage/uploads/batch-router.yaml",
      label: "storage/uploads/batch-router.yaml",
      kind: "Error",
      hint: localized.text16,
      inert: true,
    },
  ];

  it("shows a corpus error as an inert result when it is the only match", async () => {
    render(<RecordPickerWithLogic items={withError} />);
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(localized.text18);

    expect(options[0]).not.toHaveAttribute("aria-disabled");
  });

  it("preserves the empty state when nothing matches", async () => {
    render(<RecordPickerWithLogic items={withError} />);
    await userEvent.type(screen.getByRole("combobox"), labelText.extra27);
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(localized.text20)).toBeInTheDocument();
  });

  it("distinguishes a real record from a corpus error beside it", async () => {
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
    const errorOption = options.find((option) => option.textContent?.includes(localized.text22));

    expect(recordOption).not.toHaveAttribute("aria-disabled");
    expect(errorOption).not.toHaveAttribute("aria-disabled");
    expect(errorOption).toHaveTextContent("Error");
  });

  it("calls onSelectInert when a corpus error is clicked", async () => {
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

  it("also calls onSelectInert when Enter selects a corpus error", async () => {
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

  it("does nothing on click without onSelectInert", async () => {
    const onSelect = jest.fn();
    render(<RecordPickerWithLogic items={withError} onSelect={onSelect} />);
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    await userEvent.click(screen.getByRole("option"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("preserves the error within the result limit alongside many matching records", async () => {
    const manyMatches = Array.from({ length: 5 }, (_, n) => ({
      id: `storage/uploads/other-${n}`,
      label: `Sibling ${n}`,
      kind: "Record",
      hint: "batch-router-nachbar",
    }));
    const items = [
      {
        id: "storage/uploads/batch-router.yaml",
        label: "storage/uploads/batch-router.yaml",
        kind: "Error",
        hint: localized.text27,
        inert: true,
      },
      ...manyMatches,
    ];
    render(<RecordPickerWithLogic items={items} limit={2} />);
    await userEvent.type(screen.getByRole("combobox"), "batch-router");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent(localized.text28);
  });
});

describe("Accessibility of inert RecordPicker results", () => {
  it("does not mark an inert result as aria-disabled", () => {
    render(
      <RecordPicker
        containerStyle={{}}
        inputStyle={{}}
        listStyle={{}}
        emptyStyle={{}}
        query={germanLabels.text163}
        placeholder=""
        emptyText=""
        onQueryChange={jest.fn()}
        onKeyDown={jest.fn()}
        results={[
          {
            key: "err",
            label: "storage/uploads/batch-router.yaml",
            kind: "Error",
            hint: localized.text30,
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
    expect(option).toHaveTextContent(localized.text31);
  });

  it("leaves real results without aria-disabled", () => {
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

describe("row height prevents clipped content", () => {
  const many = Array.from({ length: 3 }, (_, index) => ({
    id: `r-${index}`,
    label: `Record ${index}`,
    kind: "Record",
    hint: `hint-${index}`,
  }));

  it("sets a fixed row height rather than only a minimum", () => {
    const { container } = render(<RecordPickerWithLogic items={many} />);
    const rows = container.querySelectorAll<HTMLElement>("[data-result]");
    expect(rows.length).toBe(3);
    rows.forEach((row) => {
      expect(row.style.height).not.toBe("");
      expect(Number.parseFloat(row.style.height)).toBeGreaterThan(0);
    });
  });

  it("calculates row height from all content rather than font line heights alone", () => {
    const EXPECTED_ROW_HEIGHT = 18 + 10 + 14 + 16;
    const VISIBLE_ROWS = 7;

    const { container } = render(<RecordPickerWithLogic items={many} />);
    const list = screen.getByRole("listbox");
    const row = container.querySelector<HTMLElement>("[data-result]")!;

    expect(Number.parseFloat(row.style.height)).toBe(EXPECTED_ROW_HEIGHT);
    expect(Number.parseFloat(list.style.maxHeight)).toBe(EXPECTED_ROW_HEIGHT * VISIBLE_ROWS);

    expect(row.style.boxSizing).toBe("border-box");
  });
});

describe("Snapshot tests for RecordPicker", () => {
  it("with matches", () => {
    const { container } = render(<RecordPickerWithLogic items={items} />);
    expect(stableIds(container.firstChild as HTMLElement)).toMatchSnapshot();
  });

  it("without entries", () => {
    const { container } = render(<RecordPickerWithLogic items={[]} />);
    expect(stableIds(container.firstChild as HTMLElement)).toMatchSnapshot();
  });
});
