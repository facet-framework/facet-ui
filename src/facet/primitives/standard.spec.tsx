import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createText } from "../i18n/text";
import { renderInGerman } from "../i18n/testing";
import { AreaBar, TabPanel } from "./area";
import { DataTable } from "./collection";
import { ConfirmButton, CONFIRM_LOCK_MS, isControl } from "./confirm";
import { Button, Chip, Segment, Tabs, tabId } from "./controls";
import { ErrorState, ListRow, LoadingState, Metric, OfflineState } from "./display";
import { Dialog, Sheet } from "./overlay";
import { OVERLAY_HOST_ATTRIBUTE, focusableIn, initialFocus, overlayHostFor } from "./overlayHost";
import { TOAST_EXIT_MS, TOAST_UNDONE_MS, Toast, ToastRegion } from "./toast";

const german = createText("de");
const hosts = () => Array.from(document.querySelectorAll(`[${OVERLAY_HOST_ATTRIBUTE}]`));

afterEach(() => {
  hosts().forEach((host) => host.remove());
});

/** A page whose dialog is declared deep inside a transformed panel, as real pages build them. */
function Page({ inline = false, autofocus = false }: { inline?: boolean; autofocus?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="t-app" data-testid="root">
      <div style={{ transform: "translateY(0)" }} data-testid="panel">
        <button type="button" onClick={() => setOpen(true)}>
          Clear board
        </button>
        <Dialog
          open={open}
          inline={inline}
          title="Clear the board?"
          onClose={() => setOpen(false)}
          footer={<Button onClick={() => setOpen(false)}>Clear</Button>}
        >
          <label>
            Name <input data-autofocus={autofocus ? "" : undefined} />
          </label>
        </Dialog>
      </div>
    </div>
  );
}

describe("Dialog and Sheet as overlays", () => {
  it("renders the dialog into the palette root's overlay host, outside the panel it is declared in", async () => {
    render(<Page />);
    await userEvent.click(screen.getByRole("button", { name: "Clear board" }));
    const dialog = screen.getByRole("dialog", { name: "Clear the board?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const host = dialog.closest(`[${OVERLAY_HOST_ATTRIBUTE}]`);
    expect(host?.parentElement).toBe(screen.getByTestId("root"));
    expect(screen.getByTestId("panel")).not.toContainElement(dialog);
  });

  it("moves the focus in, keeps Tab inside, closes on Esc and returns the focus to the trigger", async () => {
    render(<Page />);
    const trigger = screen.getByRole("button", { name: "Clear board" });
    await userEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button", { name: "Close" });
    const clear = within(dialog).getByRole("button", { name: "Clear" });
    expect(close).toHaveFocus();
    clear.focus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(clear).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("gives the focus to an element marked data-autofocus", async () => {
    render(<Page autofocus />);
    await userEvent.click(screen.getByRole("button", { name: "Clear board" }));
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  });

  it("keeps an inline dialog in the page flow without scrim, trap or Esc", async () => {
    const { container } = render(<Page inline />);
    await userEvent.click(screen.getByRole("button", { name: "Clear board" }));
    const dialog = screen.getByRole("dialog", { name: "Clear the board?" });
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(screen.getByTestId("panel")).toContainElement(dialog);
    expect(container.querySelector(".t-scrim")).toBeNull();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes a sheet from its scrim, but not on an Esc a child already handled", async () => {
    const onClose = jest.fn();
    render(
      <Sheet open title="New note" onClose={onClose}>
        <input
          aria-label="Text"
          onKeyDown={(e) => {
            if (e.key === "Escape") e.preventDefault();
          }}
        />
      </Sheet>,
    );
    const sheet = screen.getByRole("dialog", { name: "New note" });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Text" }), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(sheet, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    const scrim = document.querySelector(".t-scrim") as HTMLElement;
    await userEvent.click(scrim);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("traps nothing in a sheet that is not modal", () => {
    render(
      <>
        <button type="button">Outside</button>
        <Sheet open modal={false} title="Dock">
          <button type="button">Inside</button>
        </Sheet>
      </>,
    );
    expect(screen.getByRole("complementary", { name: "Dock" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inside" })).not.toHaveFocus();
    expect(document.querySelector(".t-scrim")).toBeNull();
  });

  it("finds focusable elements and the opening focus without hidden or inert ones", () => {
    const box = document.createElement("div");
    box.innerHTML =
      '<div hidden><button>Hidden</button></div><button disabled>Off</button><a href="#x">Link</a><input type="hidden">';
    expect(focusableIn(box).map((el) => el.textContent)).toEqual(["Link"]);
    expect(initialFocus(document.createElement("div")).tagName).toBe("DIV");
    expect(overlayHostFor(null).parentElement).toBe(document.body);
    expect(overlayHostFor(null)).toBe(overlayHostFor(null));
  });
});

describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("offers Undo only with a handler, restores on press and never expires afterwards", () => {
    const onUndo = jest.fn();
    const onExpire = jest.fn();
    const onDismissed = jest.fn();
    render(
      <Toast onUndo={onUndo} onExpire={onExpire} onDismissed={onDismissed}>
        Cleared 4 items
      </Toast>,
    );
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveAccessibleDescription("8 s");
    act(() => {
      jest.advanceTimersByTime(3_000);
    });
    expect(undo).toHaveAccessibleDescription("5 s");
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Undone");
    act(() => {
      jest.advanceTimersByTime(TOAST_UNDONE_MS);
    });
    expect(screen.getByRole("status")).toHaveAttribute("data-leaving", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Undone");
    act(() => {
      jest.advanceTimersByTime(TOAST_EXIT_MS);
    });
    act(() => {
      jest.advanceTimersByTime(20_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
    expect(onDismissed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("ends the window for real: the exit plays, onExpire runs once and Undo is gone", () => {
    const onExpire = jest.fn();
    render(
      <Toast duration={2} onUndo={() => undefined} onExpire={onExpire}>
        Saved
      </Toast>,
    );
    act(() => {
      jest.advanceTimersByTime(2_250);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveAttribute("data-leaving", "true");
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    act(() => {
      jest.advanceTimersByTime(TOAST_EXIT_MS);
    });
    expect(screen.queryByRole("status")).toBeNull();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("holds the window while the pointer or the focus is on it", () => {
    const onExpire = jest.fn();
    render(
      <Toast duration={1} onUndo={() => undefined} onExpire={onExpire}>
        Saved
      </Toast>,
    );
    const toast = screen.getByRole("status");
    fireEvent.pointerEnter(toast);
    expect(toast).toHaveAttribute("data-paused", "true");
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
    fireEvent.pointerLeave(toast);
    fireEvent.focus(screen.getByRole("button", { name: "Undo" }));
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
    fireEvent.blur(screen.getByRole("button", { name: "Undo" }));
    act(() => {
      jest.advanceTimersByTime(1_250);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("says an irreversible action cannot be undone instead of offering Undo", () => {
    render(
      <Toast tone="bad" irreversible onUndo={() => undefined}>
        Branch deleted
      </Toast>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Branch deletedCannot be undone");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("stays without a duration and shows no remaining time", () => {
    const onExpire = jest.fn();
    render(
      <Toast duration={null} onUndo={() => undefined} onExpire={onExpire}>
        Kept
      </Toast>,
    );
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Undo" })).not.toHaveAccessibleDescription();
  });

  it("puts the region into the overlay host and adds no live region of its own", () => {
    render(
      <div className="t-app" data-testid="root">
        <div data-testid="panel">
          <ToastRegion>
            <Toast duration={null}>One</Toast>
          </ToastRegion>
        </div>
        <ToastRegion inline>
          <Toast duration={null}>Two</Toast>
        </ToastRegion>
      </div>,
    );
    const regions = screen.getAllByTestId("toast-region");
    const fixed = regions.find((r) => !r.classList.contains("t-toast-region--inline"))!;
    const inline = regions.find((r) => r.classList.contains("t-toast-region--inline"))!;
    expect(screen.getByTestId("panel")).not.toContainElement(fixed);
    expect(fixed.parentElement).toHaveAttribute(OVERLAY_HOST_ATTRIBUTE);
    expect(inline).toHaveClass("t-toast-region--inline");
    expect(fixed).not.toHaveAttribute("role");
    expect(fixed).not.toHaveAttribute("aria-live");
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  it("speaks German under the German locale", () => {
    jest.useRealTimers();
    renderInGerman(
      <Toast duration={null} irreversible>
        x
      </Toast>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(german.t("primitives.toast.irreversible"));
  });
});

describe("Segment", () => {
  function Choice({ onChange }: { onChange?: (v: string) => void }) {
    const [value, setValue] = useState("day");
    return (
      <Segment
        label="Range"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange?.(v);
        }}
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week", disabled: true, reason: "No data" },
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
      />
    );
  }

  it("has one tab stop, moves and chooses with the arrows and skips a disabled option", async () => {
    const onChange = jest.fn();
    render(<Choice onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
    radios[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Month" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Month" })).toBeChecked();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Year" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Year" })).toBeChecked();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Day" })).toHaveFocus();
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(["month", "year", "day", "year", "day"]);
  });

  it("keeps a disabled option visible with its reason and never chooses it", async () => {
    const onChange = jest.fn();
    render(<Choice onChange={onChange} />);
    const week = screen.getByRole("radio", { name: "Week" });
    expect(week).toHaveAttribute("aria-disabled", "true");
    expect(week).toHaveAccessibleDescription("No data");
    await userEvent.click(week);
    expect(onChange).not.toHaveBeenCalled();
    expect(week).not.toBeChecked();
  });

  it("makes the first enabled option the tab stop when nothing valid is chosen", () => {
    render(
      <Segment
        label="Mode"
        value="gone"
        full
        options={[
          { value: "a", label: "A", disabled: true },
          { value: "b", label: "B" },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radiogroup")).toHaveClass("t-segment--full");
  });
});

describe("Tabs, AreaBar and TabPanel", () => {
  it("moves between in-page tabs with the arrows and points at the panel", async () => {
    function Page() {
      const [tab, setTab] = useState("a");
      return (
        <>
          <Tabs
            label="Sections"
            value={tab}
            onChange={setTab}
            panelId="panel"
            idPrefix="s"
            items={[
              { value: "a", label: "Tasks" },
              { value: "b", label: "Code" },
              { value: "c", label: "Notes" },
            ]}
          />
          <TabPanel id="panel" tabKey={tab} labelledBy={tabId("s", tab)}>
            Panel {tab}
          </TabPanel>
        </>
      );
    }
    render(<Page />);
    const first = screen.getByRole("tab", { name: "Tasks" });
    expect(first).toHaveAttribute("aria-controls", "panel");
    expect(screen.getByRole("tab", { name: "Code" })).toHaveAttribute("tabindex", "-1");
    first.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Notes" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Notes" })).toHaveTextContent("Panel c");
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tabpanel", { name: "Tasks" })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: "Tasks" })).toHaveAttribute("aria-selected", "true");
  });

  it("draws pages as links, the current one marked, with groups, counts, meta and action", async () => {
    const onChange = jest.fn();
    render(
      <AreaBar
        title="Team"
        meta="4 people"
        value="open"
        onChange={onChange}
        action={<Button variant="primary">Invite</Button>}
        tabs={[
          { value: "open", label: "Open", count: 4, href: "#open" },
          { value: "done", label: "Done" },
          { value: "settings", label: "Settings", group: "admin" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Team" });
    expect(within(nav).getByRole("link", { name: "Open 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("4 people");
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
    expect(screen.getAllByTestId("area-separator")).toHaveLength(1);
    await userEvent.click(within(nav).getByRole("link", { name: "Done" }));
    expect(onChange).toHaveBeenCalledWith("done");
    await userEvent.click(within(nav).getByRole("link", { name: "Open 4" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("is a tablist with arrow keys, and the indicator glides only after the first placement", async () => {
    function Area() {
      const [tab, setTab] = useState("one");
      return (
        <>
          <AreaBar
            kind="tabs"
            title="Settings"
            compact
            idPrefix="area"
            panelId="area-panel"
            value={tab}
            onChange={setTab}
            area="settings"
            tabs={[
              { value: "one", label: "General" },
              { value: "two", label: "Access" },
            ]}
          />
          <TabPanel id="area-panel" tabKey={tab} labelledBy={tabId("area", tab)}>
            {tab}
          </TabPanel>
        </>
      );
    }
    render(<Area />);
    const list = screen.getByRole("tablist", { name: "Settings" });
    expect(screen.queryByRole("heading")).toBeNull();
    const indicator = screen.getByTestId("area-indicator");
    expect(indicator).toHaveAttribute("data-glide", "false");
    expect(indicator.style.getPropertyValue("--t-indicator-o")).toBe("1");
    within(list).getByRole("tab", { name: "General" }).focus();
    await userEvent.keyboard("{End}");
    expect(within(list).getByRole("tab", { name: "Access" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Access" })).toHaveTextContent("two");
    expect(indicator).toHaveAttribute("data-glide", "true");
    expect(window.sessionStorage.getItem("t-area-settings")).toBe("two");
    await userEvent.keyboard("{ArrowRight}");
    expect(within(list).getByRole("tab", { name: "General" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("AreaBar placement", () => {
  it("glides in from the tab last visited in the same area and scrolls the active tab into view", () => {
    window.sessionStorage.setItem("t-area-team", "done");
    const scrollTo = jest.fn();
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    const saved = Object.getOwnPropertyDescriptors(HTMLElement.prototype);
    Object.defineProperty(proto, "offsetLeft", {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.tab === "open" ? 400 : 0;
      },
    });
    Object.defineProperty(proto, "offsetWidth", { configurable: true, get: () => 80 });
    Object.defineProperty(proto, "scrollTo", { configurable: true, value: scrollTo });
    const frames: FrameRequestCallback[] = [];
    const raf = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    try {
      render(
        <AreaBar
          title="Team"
          area="team"
          value="open"
          tabs={[
            { value: "done", label: "Done" },
            { value: "open", label: "Open" },
          ]}
        />,
      );
      const indicator = screen.getByTestId("area-indicator");
      expect(indicator.style.getPropertyValue("--t-indicator-x")).toBe("0px");
      expect(indicator).toHaveAttribute("data-glide", "false");
      act(() => frames.forEach((cb) => cb(0)));
      expect(indicator.style.getPropertyValue("--t-indicator-x")).toBe("400px");
      expect(indicator).toHaveAttribute("data-glide", "true");
      expect(scrollTo).toHaveBeenCalledWith({ left: 512, behavior: "auto" });
      expect(window.sessionStorage.getItem("t-area-team")).toBe("open");
    } finally {
      raf.mockRestore();
      for (const key of ["offsetLeft", "offsetWidth", "scrollTo"]) {
        if (saved[key]) Object.defineProperty(proto, key, saved[key]);
        else delete proto[key];
      }
    }
  });
});

describe("Metric", () => {
  it("draws an unmeasured value as a dash read as not measured, never as 0", () => {
    render(<Metric label="Tokens" value={null} of={null} detail="offline" />);
    const value = screen.getByTestId("metric-value");
    expect(value).toHaveTextContent("—not measured / —not measured");
    expect(value).not.toHaveTextContent("0");
    expect(value.closest(".t-metric")).toHaveAttribute("data-measured", "false");
    expect(screen.getByText("offline")).toBeInTheDocument();
  });

  it("counts up only where the counter prints the same digits, and always reads the final value", () => {
    render(
      <>
        <Metric label="Live" value={42} count tone="ok" size="large" />
        <Metric label="Tokens" value={12345} count unit="tok" />
      </>,
    );
    const [live, tokens] = screen.getAllByTestId("metric-value");
    const counter = live.querySelector(".t-counter") as HTMLElement;
    expect(counter).toHaveAttribute("aria-hidden", "true");
    expect(counter.style.getPropertyValue("--t-counter-target")).toBe("42");
    expect(live).toHaveTextContent("42");
    expect(live).toHaveClass("t-ok");
    expect(tokens.querySelector(".t-counter")).toBeNull();
    expect(tokens).toHaveTextContent("12,345 tok");
  });

  it("formats with the caller's function and the active locale", () => {
    renderInGerman(<Metric label="Time" value={1234.5} of={2000} format={undefined} />);
    expect(screen.getByTestId("metric-value")).toHaveTextContent("1.234,5 / 2.000");
    render(<Metric label="Clock" value={75} format={(s) => `${Math.floor(s / 60)}:15`} />);
    expect(screen.getByText("1:15")).toBeInTheDocument();
  });
});

describe("State surfaces", () => {
  it("announces an error as an alert with its measured cause and a retry", async () => {
    const onRetry = jest.fn();
    render(<ErrorState reason="HTTP 503" onRetry={onRetry} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Does not load");
    expect(within(alert).getByText("HTTP 503")).toHaveClass("t-mono");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows a missing right as a calm status with who may, and no retry", () => {
    render(<ErrorState kind="forbidden" who="Owner · Lead" onRetry={() => undefined} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("No permission");
    expect(status).toHaveTextContent("Owner · Lead");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("names a loading skeleton and draws it in the shape of what comes", () => {
    const { rerender } = render(<LoadingState shape="table" rows={3} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("data-shape", "table");
    expect(screen.getAllByTestId("loading-row")).toHaveLength(3);
    rerender(<LoadingState shape="surface" rows={2} label="Loading notes" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading notes");
    rerender(<LoadingState rows={-1} />);
    expect(screen.queryAllByTestId("loading-row")).toHaveLength(0);
  });

  it("says offline with the measured time and offers a reconnect", async () => {
    const onReconnect = jest.fn();
    const { rerender } = render(
      <OfflineState detail="Last known state" since="since 14:20" onReconnect={onReconnect} />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Disconnected");
    expect(status).toHaveTextContent("Last known state");
    expect(status).toHaveTextContent("since 14:20");
    await userEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    expect(onReconnect).toHaveBeenCalled();
    rerender(<OfflineState title="No core" />);
    expect(screen.getByRole("status")).toHaveTextContent("No core");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("speaks German under the German locale", () => {
    renderInGerman(
      <>
        <OfflineState onReconnect={() => undefined} />
        <ErrorState kind="forbidden" />
      </>,
    );
    expect(screen.getByText(german.t("primitives.state.offline"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: german.t("primitives.state.reconnect") }),
    ).toBeInTheDocument();
    expect(screen.getByText(german.t("primitives.state.forbidden"))).toBeInTheDocument();
  });
});

/** jsdom has no PointerEvent: a pointer leaving is a pointerout carrying its pointer type. */
function leave(from: Element, pointerType: string, to: Element) {
  const event = new MouseEvent("pointerout", { bubbles: true, relatedTarget: to });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(from, event);
}

describe("ConfirmButton", () => {
  function clock() {
    let t = 1_000;
    return { now: () => t, advance: (ms: number) => (t += ms) };
  }

  it("arms on the first press, ignores a double click and confirms on a later second press", async () => {
    const time = clock();
    const onConfirm = jest.fn(async () => true);
    render(<ConfirmButton label="Delete" onConfirm={onConfirm} now={time.now} />);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAccessibleDescription("Press twice. Escape or moving away disarms.");
    await userEvent.click(button);
    expect(button).toHaveTextContent("Confirm: Delete");
    expect(button).toHaveAttribute("data-state", "armed");
    expect(screen.getByText("Armed. Press again to confirm.")).toBeInTheDocument();
    time.advance(CONFIRM_LOCK_MS - 1);
    await userEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
    time.advance(2);
    await userEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(button).toHaveTextContent("Done");
    expect(screen.getByText("Confirmed.")).toBeInTheDocument();
    await userEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("goes back to rest when the action was not carried out or failed", async () => {
    const time = clock();
    const results = [false, new Error("refused")];
    const onConfirm = jest.fn(() => {
      const next = results.shift();
      if (next instanceof Error) throw next;
      return next as boolean;
    });
    render(<ConfirmButton label="Send" variant="primary" onConfirm={onConfirm} now={time.now} />);
    const button = screen.getByRole("button", { name: "Send" });
    for (let i = 0; i < 2; i++) {
      await userEvent.click(button);
      time.advance(CONFIRM_LOCK_MS);
      await userEvent.click(button);
      expect(button).toHaveTextContent("Send");
      expect(button).toHaveAttribute("data-state", "idle");
    }
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("disarms on Esc without closing the dialog around it, and on blur", async () => {
    const onClose = jest.fn();
    render(
      <Dialog open title="Delete board" onClose={onClose}>
        <ConfirmButton label="Delete" onConfirm={() => true} />
        <button type="button">Other</button>
      </Dialog>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    await userEvent.click(button);
    expect(button).toHaveAttribute("data-state", "armed");
    await userEvent.keyboard("{Escape}");
    expect(button).toHaveAttribute("data-state", "idle");
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(button);
    fireEvent.blur(button);
    expect(button).toHaveAttribute("data-state", "idle");
  });

  it("disarms when a mouse pointer leaves onto another control, not onto plain space", async () => {
    render(
      <>
        <ConfirmButton label="Delete" onConfirm={() => true} />
        <button type="button">Other</button>
        <p>Space</p>
      </>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    await userEvent.click(button);
    leave(button, "touch", screen.getByRole("button", { name: "Other" }));
    expect(button).toHaveAttribute("data-state", "armed");
    leave(button, "mouse", screen.getByText("Space"));
    expect(button).toHaveAttribute("data-state", "armed");
    leave(button, "mouse", screen.getByRole("button", { name: "Other" }));
    expect(button).toHaveAttribute("data-state", "idle");
    expect(isControl(null)).toBe(false);
  });

  it("arms in German under the German locale", async () => {
    renderInGerman(
      <ConfirmButton label="Delete" size="small" icon="trash" onConfirm={() => true} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button")).toHaveTextContent(
      german.t("primitives.confirm.armed", { label: "Delete" }),
    );
  });
});

describe("Rows, chips and buttons", () => {
  it("renders a list row without an action as a plain row, never a dead button", () => {
    render(
      <>
        <ListRow title="Read only" sub="no action" current />
        <ListRow title="Open" onClick={() => undefined} current />
      </>,
    );
    expect(screen.queryByRole("button", { name: /Read only/ })).toBeNull();
    expect(screen.getByText("Read only").closest(".t-list-row")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: /Open/ })).toHaveAttribute("aria-current", "true");
  });

  it("keeps a chip's label and count apart for assistive technology", () => {
    render(
      <Chip pressed count={4} onClick={() => undefined}>
        Open
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Open 4" })).toBeInTheDocument();
  });

  it("swallows presses while busy, also as a submit button", async () => {
    const onClick = jest.fn();
    const onSubmit = jest.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" busy block onClick={onClick}>
          Save
        </Button>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("t-btn--block");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the attributes and handlers of a button drawn as a link", async () => {
    const onClick = jest.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <Button href="/docs" data-testid="docs" onClick={onClick} disabled>
        Docs
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("data-testid", "docs");
    expect(link).not.toHaveAttribute("disabled");
    await userEvent.click(link);
    expect(onClick).toHaveBeenCalled();
  });
});

describe("DataTable rows as a grid", () => {
  const rows = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
    { id: "c", name: "Gamma" },
  ];
  it("gives the rows one tab stop, moves with the arrows and activates with Enter and Space", async () => {
    const onRow = jest.fn();
    render(
      <DataTable
        label="Records"
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={onRow}
        selectedKey="b"
        sort={{ key: "name", dir: "asc" }}
        columns={[
          { key: "name", label: "Name", sortable: true, render: (r) => r.name },
          { key: "id", label: "Id", sortable: true, render: (r) => r.id },
          { key: "x", label: "Plain", render: () => "" },
        ]}
      />,
    );
    expect(screen.getByRole("region", { name: "Records" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("grid", { name: "Records" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Id/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "Plain" })).not.toHaveAttribute("aria-sort");
    const [, first, second, third] = screen.getAllByRole("row");
    expect(second).toHaveAttribute("aria-selected", "true");
    expect([first, second, third].map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    act(() => first.focus());
    await userEvent.keyboard("{ArrowDown}");
    expect(second).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(third).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onRow).toHaveBeenLastCalledWith(rows[2]);
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard(" ");
    expect(onRow).toHaveBeenLastCalledWith(rows[1]);
    await userEvent.keyboard("{Home}");
    expect(first).toHaveFocus();
    expect(first.tabIndex).toBe(0);
    await userEvent.keyboard("{a}");
    expect(onRow).toHaveBeenCalledTimes(2);
  });

  it("leaves rows without an action out of the tab order", () => {
    render(
      <DataTable
        label="Plain"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[{ key: "name", label: "Name", render: (r) => r.name }]}
      />,
    );
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.getAllByRole("row")[1]).not.toHaveAttribute("tabindex");
  });
});
