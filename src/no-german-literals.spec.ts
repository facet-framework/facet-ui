import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "..");
const run = (source: string) =>
  execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: root,
    encoding: "utf8",
  }).trim();

describe("German source guard", () => {
  it("scans every tracked file, including tests, guards, snapshots and configuration", () => {
    const report = JSON.parse(
      execFileSync(process.execPath, ["scripts/check-language.mjs"], {
        cwd: root,
        encoding: "utf8",
      }),
    );
    expect(report).toEqual({ count: 0, findings: [] });
  });

  it("skips binary files but still reads text that merely looks unusual", () => {
    expect(
      run(`
      import assert from 'node:assert/strict';
      import { isBinary } from './scripts/check-language.mjs';
      assert.equal(isBinary(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])), true);
      assert.equal(isBinary(Buffer.from('plain text with symbols: \u00a9 \u2192', 'utf8')), false);
      console.log('ok');
    `),
    ).toBe("ok");
  });

  it("detects case-insensitive whole words and every accented character", () => {
    expect(
      run(`
      import assert from 'node:assert/strict';
      import { scan, words } from './scripts/check-language.mjs';
      for (const word of words) {
        assert(scan('sample', word.toUpperCase()).length > 0);
        assert.equal(scan('sample', 'prefix' + word + 'suffix').filter(h => h.kind === 'word').length, 0);
      }
      for (const code of [228, 246, 252, 196, 214, 220, 223]) {
        assert(scan('sample', String.fromCodePoint(code)).length > 0);
      }
      assert.deepEqual(scan('sample', 'English labels and ordinary punctuation.'), []);
      console.log('ok');
    `),
    ).toBe("ok");
  });

  it("has no exceptions for tests, comments, regexes, stories or other file formats", () => {
    expect(
      run(`
      import assert from 'node:assert/strict';
      import { scan } from './scripts/check-language.mjs';
      const sample = String.fromCodePoint(90, 117, 115, 97, 103, 101);
      for (const file of ['test.spec.tsx', 'view.stories.tsx', 'test.snap', 'fixture.yaml', 'README.md', 'guard.mjs', '.storybook/preview.tsx']) {
        for (const text of ['// ' + sample, '/' + sample + '/i', JSON.stringify(sample), '\\x60' + sample + '\\x60']) {
          assert.equal(scan(file, text).length, 1);
        }
      }
      console.log('ok');
    `),
    ).toBe("ok");
  });

  it("exempts only German dictionary values, never keys, comments or English sections", () => {
    expect(
      run(`
      import assert from 'node:assert/strict';
      import { scan } from './scripts/check-language.mjs';
      const sample = String.fromCodePoint(90, 117, 115, 97, 103, 101);
      for (const [file, name] of [['src/facet/i18n/de.ts', 'de'], ['src/facet/i18n/catalog/core.ts', 'deCore'], ['src/facet/i18n/catalog/elements.ts', 'deElements']]) {
        assert.deepEqual(scan(file, 'export const ' + name + ' = { key: "' + sample + '" };'), []);
        assert.equal(scan(file, 'export const ' + name + ' = { "' + sample + '": "ok" };').length, 1);
        assert.equal(scan(file, '// ' + sample).length, 1);
        assert.equal(scan(file, 'export const en = { key: "' + sample + '" };').length, 1);
      }
      console.log('ok');
    `),
    ).toBe("ok");
  });

  it("distinguishes SPDX metadata from prose without hiding raw matches", () => {
    expect(
      run(`
      import assert from 'node:assert/strict';
      import { scan, licenseIdentifier } from './scripts/check-language.mjs';
      const identifier = String.fromCodePoint(77, 73, 84);
      const source = '| react | 19.2.8 | ' + identifier + ' | Development |';
      const [hit] = scan('THIRD_PARTY.md', source);
      assert(hit);
      assert(licenseIdentifier(hit, source));
      assert(!licenseIdentifier({ ...hit, file: 'sample.spec.ts' }, source));
      assert(!licenseIdentifier(hit, identifier + ' ordinary prose'));
      console.log('ok');
    `),
    ).toBe("ok");
  });
});
