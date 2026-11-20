import { render, screen } from "@testing-library/react";
import { buildModel } from "../../core/model";
import { companionAnswer } from "../../core/companion";
import { probeOf } from "../../core/probes";
import CoverageRing from "./CoverageRing";
import ProofMatrix from "./ProofMatrix";
import ScenarioLedger from "./ScenarioLedger";

it("presents reference-only verification as test links without claiming execution", () => {
  // This fixture deliberately contains no execution result, runner, or timestamp.
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

  // Public model semantics remain association-based, including test associations.
  expect(record.proven).toBe(1);
  expect(record.scenarios[0].proven).toBe(true);
  expect(record.scenarios[0].tests[0].id).toBe("never-executed");

  const answer = companionAnswer(model, "tests");
  const coverage = probeOf(model, "coverage");
  expect(model.scnProven).toBe(1);
  expect(coverage.head).toBe("TEST MAPPINGS");
  expect(answer.facts[0]).toMatchObject({ label: "TEST MAPPED", value: "1/1" });
  expect(coverage.rows[0]).toMatchObject({ label: "TEST MAPPED", value: "1/1" });
  const presentation = JSON.stringify({
    text: answer.text,
    facts: answer.facts,
    coverage,
  });
  expect(presentation).not.toMatch(
    /getest|tested|geprüft|bewiesen|belegt|bestanden|passed|proven/i,
  );

  const { container } = render(
    <>
      <CoverageRing value={record.proven} total={record.total} />
      <ProofMatrix scenarios={record.scenarios} />
      <ScenarioLedger scenarios={record.scenarios} />
    </>,
  );
  expect(
    screen.getByRole("img", { name: "1 of 1 promises with a mapped test" }),
  ).toBeInTheDocument();
  expect(screen.getByText("All 1 promises have a mapped test.")).toBeInTheDocument();
  expect(screen.getByText("Test mapped")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(
    /getest|tested|geprüft|bewiesen|belegt|bestanden|passed|proven/i,
  );
  expect(container.innerHTML).not.toMatch(
    /aria-label="[^"]*(getest|tested|geprüft|bewiesen|belegt|bestanden|passed|proven)/i,
  );
});
