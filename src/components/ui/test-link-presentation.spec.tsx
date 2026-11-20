import { localized } from "../../i18n/legacy/components/ui/test-link-presentation.spec.text";
import { render, screen } from "@testing-library/react";
import { buildModel } from "../../core/model";
import { companionAnswer } from "../../core/companion";
import { probeOf } from "../../core/probes";
import CoverageRing from "./CoverageRing";
import ProofMatrix from "./ProofMatrix";
import ScenarioLedger from "./ScenarioLedger";

it("presents reference-only verification as test links without claiming execution", () => {
  const model = buildModel(
    {},
    [],
    [
      {
        path: "reference-only.yaml",
        raw: "",
        doc: {
          id: "tasks/create/reference-only",
          lifecycle: "active",
          contract: { scenarios: [{ id: "created", statement: "Then created" }] },
          verification: { unit_tests: [{ id: "never-executed", proves: ["created"] }] },
        },
      },
    ],
  );
  const record = model.features[0];

  expect(record.proven).toBe(1);
  expect(record.scenarios[0].proven).toBe(true);
  expect(record.scenarios[0].tests[0].id).toBe("never-executed");

  const answer = companionAnswer(model, "tests");
  const coverage = probeOf(model, "coverage");
  expect(model.scnProven).toBe(1);
  expect(coverage.head).toBe("TESTZUORDNUNGEN");
  expect(answer.facts[0]).toMatchObject({ label: "TEST ZUGEORDNET", value: "1/1" });
  expect(coverage.rows[0]).toMatchObject({ label: "TEST ZUGEORDNET", value: "1/1" });
  const presentation = JSON.stringify({
    text: answer.text,
    facts: answer.facts,
    coverage,
  });
  expect(presentation).not.toMatch(localized.text1);

  const { container } = render(
    <>
      <CoverageRing value={record.proven} total={record.total} />
      <ProofMatrix scenarios={record.scenarios} />
      <ScenarioLedger scenarios={record.scenarios} />
    </>,
  );
  expect(screen.getByRole("img", { name: localized.text2 })).toBeInTheDocument();
  expect(screen.getByText(localized.text3)).toBeInTheDocument();
  expect(screen.getByText("Test zugeordnet")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(localized.text4);
  expect(container.innerHTML).not.toMatch(localized.text5);
});
