/**
 * The surfaces an app opens for contributions it does not know in advance —
 * the doors, settings pages, tiles and conversation modes Atlas plugins bring
 *. Each case renders the component and looks where the
 * contribution has to land, not at a returned value.
 */
import { render, screen, within } from "@testing-library/react";
import { MoreSheet, TopBar } from "./shell/Shell";

const top = {
  canBack: false,
  canForward: false,
  roleName: "Developer",
  theme: { label: "Dark", icon: "moon" as const },
};

describe("plugin surfaces", () => {
  it("draws app actions in the desktop top bar and leaves them out of the compact one", () => {
    const { rerender } = render(<TopBar {...top} actions={<button type="button">Door</button>} />);
    const actions = screen.getByTestId("top-actions");
    expect(within(actions).getByRole("button", { name: "Door" })).toBeInTheDocument();
    // The actions stand before the command field, inside the header.
    expect(actions.closest("header")).not.toBeNull();
    rerender(<TopBar {...top} compact actions={<button type="button">Door</button>} />);
    expect(screen.queryByRole("button", { name: "Door" })).not.toBeInTheDocument();
  });

  it("draws the same actions in the More sheet", () => {
    render(
      <MoreSheet
        open
        items={[]}
        roleName="Developer"
        actions={<button type="button">Door</button>}
      />,
    );
    expect(
      within(screen.getByTestId("more-actions")).getByRole("button", { name: "Door" }),
    ).toBeInTheDocument();
  });
});
