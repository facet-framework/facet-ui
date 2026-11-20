import { render, screen } from "@testing-library/react";
import { AppShell } from "./Shell";
it("renders application slots and applies modal isolation", () => {
  const { rerender } = render(
    <AppShell
      top="Header"
      nav="Navigation"
      chat="Messages"
      overlay="Dialog"
      modal
      density="compact"
      reducedMotion
      theme={{ theme: "paper", mode: "light" }}
    >
      Content
    </AppShell>,
  );
  expect(screen.getByRole("main", { hidden: true })).toHaveAttribute("inert");
  expect(screen.getByTestId("app-shell")).toHaveAttribute("data-density", "compact");
  rerender(
    <AppShell top="Header" mobile tabbar="Tabs" focus>
      Content
    </AppShell>,
  );
  expect(screen.getByText("Tabs")).toBeInTheDocument();
  expect(screen.getByRole("main")).not.toHaveAttribute("inert");
  expect(screen.getByTestId("app-shell")).toHaveAttribute("data-focus", "on");
});
