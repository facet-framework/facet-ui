import { registry } from "../../fixtures/registry";

// Synthetic example associations; these do not assert executed tests.
export const TEST_COUNTS: Record<string, { Unit: number; Integration: number; E2E: number }> =
  Object.fromEntries(
    registry.features.map((feature) => [
      feature.id,
      {
        Unit: feature.tests.filter((test) => test.kind === "Unit").length,
        Integration: feature.tests.filter((test) => test.kind === "Integration").length,
        E2E: feature.tests.filter((test) => test.kind === "E2E").length,
      },
    ]),
  );

const example = registry.features.find((feature) => feature.id === "lists/permissions/admin")!;
const record = {
  schema_version: "0.1",
  id: example.id,
  type: "feature",
  lifecycle: "active",
  intent: { summary: example.summary },
  contract: {
    scenarios: example.scenarios.map((scenario) => ({ id: scenario.id, statement: scenario.text })),
  },
  lineage: { owner: { team: example.owner }, created_at: example.createdAt },
};
export const COMMIT_GATE_JSON = JSON.stringify(record, null, 2);
export const COMMIT_GATE_YAML = [
  'schema_version: "0.1"',
  `id: ${record.id}`,
  "type: feature",
  "lifecycle: active",
  "intent:",
  `  summary: ${JSON.stringify(example.summary)}`,
  "contract:",
  "  scenarios:",
  ...example.scenarios.flatMap((scenario) => [
    `    - id: ${scenario.id}`,
    `      statement: ${JSON.stringify(scenario.text)}`,
  ]),
  "lineage:",
  "  owner:",
  `    team: ${example.owner}`,
].join("\n");
