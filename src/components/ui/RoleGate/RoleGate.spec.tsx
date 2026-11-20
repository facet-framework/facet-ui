import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleGateWithLogic, { RoleGate } from ".";
import { ROLES } from "../../../core";
import { renderInGerman } from "../../../facet/i18n/testing";

describe("Unit tests for RoleGate", () => {
  it("asks the question and says what the answer does", () => {
    render(<RoleGateWithLogic />);
    expect(screen.getByRole("heading", { name: "What are you here for?" })).toBeInTheDocument();
    expect(
      screen.getByText("Sets the order, not the access. Switchable at any time."),
    ).toBeInTheDocument();
  });

  it("accepts the plain version without roles", () => {
    render(
      <RoleGate
        containerStyle={{}}
        innerStyle={{}}
        headlineStyle={{}}
        subStyle={{}}
        listStyle={{}}
        skipStyle={{}}
        roles={[]}
        headline="What are you here for?"
        sub=""
        skipLabel="continue"
        onSkip={jest.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "continue" })).toBeInTheDocument();
  });
});

describe("Unit tests for withRoleGateLogic", () => {
  it("offers all eight roles to choose from", () => {
    const { container } = render(<RoleGateWithLogic />);
    expect(container.querySelectorAll("[data-role]")).toHaveLength(ROLES.length);
  });

  it("numbers them with two digits", () => {
    const { container } = render(<RoleGateWithLogic />);
    const numbers = Array.from(container.querySelectorAll("[data-role] span:first-child")).map(
      (span) => span.textContent,
    );
    expect(numbers).toEqual(["01", "02", "03", "04", "05", "06", "07", "08"]);
  });

  it("reports the chosen role", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: /Operations/ }));
    expect(onPick).toHaveBeenCalledWith("ops");
  });

  it("can be operated by keyboard — the rows are buttons", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onPick).toHaveBeenCalledWith("c");
  });

  it("speaks German under the German locale", () => {
    renderInGerman(<RoleGateWithLogic />);
    expect(screen.getByRole("heading", { name: "Wofür bist du hier?" })).toBeInTheDocument();
    expect(
      screen.getByText("Bestimmt die Reihenfolge, nicht den Zugang. Jederzeit umschaltbar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ohne Auswahl fortfahren" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Betrieb/ })).toBeInTheDocument();
  });

  it("leads “continue without choosing” to the first role", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "continue without choosing" }));
    expect(onPick).toHaveBeenCalledWith("c");
  });

  it("accepts a different fallback", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} fallback="qa" />);
    await userEvent.click(screen.getByRole("button", { name: "continue without choosing" }));
    expect(onPick).toHaveBeenCalledWith("qa");
  });

  it("shows each role's hint", () => {
    render(<RoleGateWithLogic />);
    ROLES.forEach((role) => expect(screen.getByText(role.hint)).toBeInTheDocument());
  });
});
