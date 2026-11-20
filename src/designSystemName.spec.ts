import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}
it("keeps the design system name out of source identifiers and prose", () => {
  const scanned = files(__dirname).filter((file) => file !== __filename);
  expect(scanned.length).toBeGreaterThan(300);
  expect(scanned.filter((file) => /tiefe/i.test(readFileSync(file, "utf8")))).toEqual([]);
});
