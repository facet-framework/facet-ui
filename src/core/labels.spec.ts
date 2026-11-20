import { createText } from "../facet/i18n/text";
import { FACET_LABEL, KIND_WORD, LIFECYCLE_LABEL, TEST_KIND_LABEL } from "../design-system/tokens";
import { facetLabel, lifecycleLabel, recordKindLabel, testKindLabel } from "./labels";

const germanText = createText("de");

describe("schema value labels", () => {
  const de = createText("de");

  it("are English by default and match the exported English maps", () => {
    expect(facetLabel("contract")).toBe("Promise");
    expect(facetLabel("contract")).toBe(FACET_LABEL.contract);
    expect(testKindLabel("e2e")).toBe(TEST_KIND_LABEL.e2e);
    expect(recordKindLabel("policy")).toBe(KIND_WORD.policy);
    expect(lifecycleLabel("planned")).toBe(LIFECYCLE_LABEL.planned);
  });

  it("follow the German text", () => {
    expect(facetLabel("contract", de)).toBe(germanText.t("core.label.facet.contract"));
    expect(testKindLabel("e2e", de)).toBe(germanText.t("core.label.testKind.e2e"));
    expect(recordKindLabel("policy", de)).toBe(germanText.t("core.label.kind.policy"));
    expect(lifecycleLabel("deprecated", de)).toBe(germanText.t("core.label.lifecycle.deprecated"));
  });

  it("return an unknown value as it is instead of a key", () => {
    expect(testKindLabel("smoke", de)).toBe("smoke");
    expect(recordKindLabel("toString")).toBe("toString");
  });
});
