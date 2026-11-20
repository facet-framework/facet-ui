import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/RoleGate/RoleGate.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleGateWithLogic, { RoleGate } from ".";
import { ROLES } from "../../../core";

describe("Unit tests for RoleGate", () => {
  it("asks the question and explains the effect of the answer", () => {
    render(<RoleGateWithLogic />);
    expect(screen.getByRole("heading", { name: localized.text2 })).toBeInTheDocument();
    expect(screen.getByText(localized.text3)).toBeInTheDocument();
  });

  it("accepts an empty role list", () => {
    render(
      <RoleGate
        containerStyle={{}}
        innerStyle={{}}
        headlineStyle={{}}
        subStyle={{}}
        listStyle={{}}
        skipStyle={{}}
        roles={[]}
        headline={localized.text5}
        sub=""
        skipLabel={germanLabels.text157}
        onSkip={jest.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: germanLabels.text157 })).toBeInTheDocument();
  });
});

describe("Unit tests for withRoleGateLogic", () => {
  it("offers all eight roles", () => {
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

  it("reports the selected role", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: remainingText.text85 }));
    expect(onPick).toHaveBeenCalledWith("ops");
  });

  it("supports keyboard interaction through button rows", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onPick).toHaveBeenCalledWith("c");
  });

  it("continues with the first role when skipping selection", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: localized.text10 }));
    expect(onPick).toHaveBeenCalledWith("c");
  });

  it("accepts an alternative fallback", async () => {
    const onPick = jest.fn();
    render(<RoleGateWithLogic onPick={onPick} fallback="qa" />);
    await userEvent.click(screen.getByRole("button", { name: localized.text12 }));
    expect(onPick).toHaveBeenCalledWith("qa");
  });

  it("shows each role's hint", () => {
    render(<RoleGateWithLogic />);
    ROLES.forEach((role) => expect(screen.getByText(role.hint)).toBeInTheDocument());
  });
});
