import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/facet/screens/b-records/dossier-stick.spec.text";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderInGerman as render } from "../../i18n/testing";
import { RecordDossierPage, type RecordDossierPageProps } from "./RecordDossierPage";
import { dossierOf, siblingsOf } from "./storyData";

const record = dossierOf("workspace/board/column");

function props(over: Partial<RecordDossierPageProps> = {}): RecordDossierPageProps {
  return {
    state: "ready",
    record,
    siblings: siblingsOf(record.id),
    tab: "record",
    now: "2026-11",
    ...over,
  };
}

describe("pinnable dossier head", () => {
  it("draws no pin and no strip without a handler", () => {
    render(<RecordDossierPage {...props()} />);
    expect(screen.queryByRole("button", { name: labelText.text262 })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Oben angeheftet" })).not.toBeInTheDocument();
  });

  it("names each row's pin and reports the row it pins", () => {
    const onStick = jest.fn();
    render(<RecordDossierPage {...props({ onStick })} />);
    for (const [what, key] of [
      [labelText.text10, "path"],
      ["Status", "status"],
      ["Name", "name"],
      ["Id", "id"],
    ]) {
      fireEvent.click(screen.getByRole("button", { name: `${what}${labelText.text263}` }));
      expect(onStick).toHaveBeenLastCalledWith(key, true);
    }

    expect(screen.getByTestId("head-name")).toHaveAttribute("tabindex", "-1");
  });

  it("copies pinned rows into the strip, in head order, with a way to unpin", () => {
    const onStick = jest.fn();
    render(<RecordDossierPage {...props({ stuck: ["id", "path", "status"], onStick })} />);
    const strip = screen.getByRole("region", { name: "Oben angeheftet" });
    const rows = within(strip).getAllByTestId(/^stuck-/);
    expect(rows.map((r) => r.dataset.testid)).toEqual(["stuck-path", "stuck-status", "stuck-id"]);

    expect(within(strip).queryByRole("button", { name: remainingText.text12 })).toBeNull();
    expect(within(strip).getByText(record.id)).toBeInTheDocument();
    fireEvent.click(within(strip).getByRole("button", { name: localized.text1 }));
    expect(onStick).toHaveBeenLastCalledWith("id", false);
  });
});
