/**
 * The gear and the More sheet's settings button carry a dot while a settings
 * page waits unopened, and none otherwise. Read from the rendered bar.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoreSheet, TopBar } from "./Shell";
import { NAV } from "../fixtures/shell";
import { renderInGerman } from "../i18n/testing";
import { de } from "../i18n/de";
import { en } from "../i18n/en";

function bar(settingsFresh?: boolean, onSettings = jest.fn()) {
  return (
    <TopBar
      canBack={false}
      canForward={false}
      stats={{ features: 3, provenPct: null, drift: 0 }}
      roleName="Development"
      theme={{ label: "Light", icon: "sun" }}
      onSettings={onSettings}
      settingsFresh={settingsFresh}
    />
  );
}

describe("the settings door", () => {
  it("carries a dot named as a new settings page while one waits, and still opens the settings", async () => {
    const onSettings = jest.fn();
    render(bar(true, onSettings));
    const dot = screen.getByRole("img", { name: en["shell.top.settingsNew"] });
    const gear = screen.getByRole("button", { name: en["shell.top.settings"] });
    expect(dot.parentElement).toBe(gear.parentElement);
    await userEvent.click(gear);
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("carries no dot when nothing waits", () => {
    render(bar(false));
    expect(screen.getByRole("button", { name: en["shell.top.settings"] })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: en["shell.top.settingsNew"] })).toBeNull();
  });

  it("puts the same dot on the More sheet's settings button", () => {
    const { rerender } = render(
      <MoreSheet
        open
        items={NAV}
        roleName="Development"
        onSettings={() => undefined}
        settingsFresh
      />,
    );
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByTestId("more-settings-fresh")).toHaveAccessibleName(
      en["shell.top.settingsNew"],
    );
    rerender(<MoreSheet open items={NAV} roleName="Development" onSettings={() => undefined} />);
    expect(screen.queryByTestId("more-settings-fresh")).toBeNull();
  });

  it("names the dot in German under the German locale", () => {
    renderInGerman(bar(true));
    expect(screen.getByRole("img", { name: de["shell.top.settingsNew"] })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: de["shell.top.settings"] })).toBeInTheDocument();
  });
});
