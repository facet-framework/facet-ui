# Contributing to FACET UI

Open an issue for a reproducible defect or a small, concrete proposal. Include
the release version, expected behavior and a minimal synthetic example. Do not
include credentials, private repository contents or another project's records.
For vulnerabilities, follow [SECURITY.md](SECURITY.md).

Keep pull requests focused. Explain the behavior or responsibility being changed
and run the checks CI runs (`.github/workflows/ci.yml`) that your change
touches, at least:

Use Node.js 24 and pnpm 10.33.0. From a fresh clone:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm test:coverage --runInBand
npm pack --dry-run
```

Build before testing: the integration tests load the published CommonJS and ESM
entry points. Coverage must meet the thresholds in `jest.config.ts`.

`src/components/` contains React components, `src/core/` the React-free data layer,
`src/facet/` the FACET design system components, localization and shell, and
`src/elements/` custom-element adapters. Stories and tests live beside their source.
`test/` supplies test utilities. `dist/` is generated and excluded from Git.

Use synthetic examples. Add regression coverage for behavior changes and preserve
public entry points. Run `pnpm format` before submitting. Preserve third-party
notices and identify copied material and its upstream license.

This repository publishes curated releases. An accepted change may be integrated
with related work before the next tagged release; acceptance does not imply an
immediate package release. Maintainers review the final source and built artifacts
together.

## Rights and contributor agreement

The current project license is **Apache-2.0**; see [LICENSE](LICENSE).
Contribute only work you have the right to submit. Preserve third-party notices
and identify third-party material and its license separately.

Before merge, each contributor must explicitly sign the exact version and
SHA-256 hash of the [FACET Contributor License Agreement](CLA.md), and Pascal
Malbranche or an authorized representative must accept it. Request private
signing instructions at <hello@facet-framework.com>. Do not publish signatures,
legal identities, contact details or employer authorization evidence in this
repository. A PR
checkbox, commit signature or Signed-off-by line does not replace this agreement.
If you submitted your first pull request before signing, include its repository,
pull request number and exact head commit in the signed record of Earlier
Contributions. Both parties must explicitly accept that coverage before merge.

You retain your copyright. The CLA grants Pascal Malbranche broad transferable
and sublicensable rights, including permission to relicense your contribution
under any terms, including proprietary or commercial terms. Future releases may
use different terms, including proprietary terms, for contributions covered by
the CLA. This does not change the license of an existing release.
Open-source rights already granted for earlier releases remain in force under
their existing terms. Third-party material keeps its own terms; the CLA grants
no rights you do not own or have authority to license. Obtain any necessary
employer or other rights holder authorization before submission.

## Agent-assisted contributions

A human contributor or authorized organization must hold the necessary rights
and sign the CLA. An automated agent cannot sign on your behalf or supply
employer authorization. Review generated changes, identify their sources and
licenses, and take responsibility for the submitted patch.
