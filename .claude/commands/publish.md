---
description: Prepare @keenmate/svelte-spa-router for npm publish — verify npm sync, bump version, finalize CHANGELOG/README, validate, commit
argument-hint: rc|release|patch|minor|major
---

# /publish — prepare an npm release of @keenmate/svelte-spa-router

You are preparing `@keenmate/svelte-spa-router` for `npm publish`. **Do not run `npm publish`** — the user logs in and publishes manually (npm 2FA / OTP).

## Argument

The release type: **$ARGUMENTS**

Must be one of:

- `rc` — bump the rc counter, or start a new rc cycle.
  - If `PKG_VERSION` is `X.Y.Z-rcNN`, `NEW_VERSION = X.Y.Z-rc(NN+1)`, **zero-padded to two digits** (`rc02`, `rc09`, `rc10`, `rc11`…). Roll-over past `rc99` is unsupported; if you see `rc99` stop and ask.
  - If `PKG_VERSION` is plain `X.Y.Z`, **default to** `NEW_VERSION = X.(Y+1).0-rc01` (next minor, rc01) and **ask the user to confirm** before proceeding. If they want a different bump kind (patch / major) for the rc cycle, they can answer and you re-compute. Don't pick silently.
- `release` — promote an rc to a final release. `PKG_VERSION` must be `X.Y.Z-rcNN` → `NEW_VERSION = X.Y.Z`. If `PKG_VERSION` is already a plain release, stop and ask (they probably wanted `patch`/`minor`/`major`).
- `patch` — SemVer patch bump. Drops any `-rcNN` suffix. `1.0.1-rc05` → `1.0.1`, `1.0.0` → `1.0.1`.
- `minor` — SemVer minor bump. Drops `-rcNN`. Resets patch.
- `major` — SemVer major bump. Drops `-rcNN`. Resets minor and patch.

If missing or invalid, stop and ask which one to use (don't guess).

**Important format note:** This repo uses **zero-padded two-digit rc counters with no dot** (`5.2.0-rc02`, `5.0.0-rc11`, `1.0.0-rc12`), **not** SemVer-canonical `5.2.0-rc.2`. Every existing tag and CHANGELOG entry follows this convention — preserve it. npm accepts both forms as pre-release identifiers; the consistency matters more than the canonical form.

## Repo layout

Single package, published from the root:

- `package.json` — defines the package (`@keenmate/svelte-spa-router`)
- `CHANGELOG.md` — at the repo root, single source of truth
- `README.md` — at the repo root, has a `## What's new` heading with **`### vX.Y.Z` subsections** (max two — see step 5)
- `src/lib/` — published source (`.js`, `.ts`, `.svelte`, `.d.ts`)
- `docs/` — long-form documentation, currently **NOT** in the published package (not listed in `files:`)

The `example/`, `example-history/`, and `svelte-spa-router-showcase/` subdirectories are separate apps used for demos / dev-loop testing and are **not** in the published package (`files:` in `package.json` excludes them by listing only `src/lib/**/*` + the three root docs). Don't run lint or tests under those directories.

There is **no build step for the library** — it's distributed as source. Do not run `npm run build`, `tsc`, or anything similar against the library itself. The `package.json` `files:` field is the only thing that gates what ends up in the tarball.

## CHANGELOG convention (Keep-a-Changelog + `[PUBLISHED]` marker)

Two-part shape:

- **`## [Unreleased]`** — always present at the very top of the CHANGELOG. Active work accumulates here under `### Added` / `### Changed` / `### Fixed` / `### Removed` subsections. No date, no version.
- **`## [X.Y.Z] - YYYY-MM-DD [PUBLISHED]`** — past releases that are confirmed on npmjs.com. The `[PUBLISHED]` tag at the end of the heading is what `/publish` writes to mark a version as having actually shipped.

The existing CHANGELOG uses subheading variants like `### Changed (docs)` or `### Removed (breaking — rc02 is unreleased)` — that's fine, preserve them. The `### Added` / `### Changed` / `### Fixed` / `### Removed` prefix is what matters.

Example:

```
## [Unreleased]

### Added
- Something the next release will ship.

## [5.2.0] - 2026-05-29 [PUBLISHED]

### Added
- ...

## [5.1.1] - 2026-04-25 [PUBLISHED]

### Fixed
- ...
```

Publishing means:

1. Renaming `## [Unreleased]` to `## [NEW_VERSION] - <today> [PUBLISHED]` (in-place — the bullet content under it carries over unchanged).
2. Inserting a fresh empty `## [Unreleased]` block above it (with empty `### Added` / `### Changed` / `### Fixed` subsections) so the next dev cycle has somewhere to land.

**RC special case:** Unlike plain releases, an rc *can* legitimately be re-cut. If `## [Unreleased]` is empty but the topmost block is a `-rcNN` waiting for more work, that's a different scenario — covered in step 1.

## Resolve versions

- `PKG_VERSION` — read `"version": "X.Y.Z..."` from `package.json`.
- `CHANGELOG_LATEST_PUBLISHED` — the topmost `## [X.Y.Z] - YYYY-MM-DD [PUBLISHED]` entry in `CHANGELOG.md`.
- `NPM_LATEST` — the value of `dist-tags.latest` returned by `https://registry.npmjs.org/@keenmate/svelte-spa-router`. (Use the `latest` dist-tag, not `versions` ordering — `versions` is an object and isn't reliably ordered, and we care about what users actually `npm install` by default.)
- `NEW_VERSION` — computed from the argument per the table above.

## Steps (in order)

### 0. npm registry sync check (PREREQUISITE)

Verify that what the local CHANGELOG and package.json say agrees with what's actually on npmjs.com. This is a guard against drift — e.g. a version that was prepared and `[PUBLISHED]`-tagged locally but never actually pushed to npm.

- Fetch `https://registry.npmjs.org/@keenmate/svelte-spa-router`. Read `dist-tags.latest` → `NPM_LATEST`.
  - If the request 404s or returns no `dist-tags`, this is a first-time publish — skip the comparison and proceed to step 1.
  - If the request fails for transient reasons (network), stop and ask whether to retry or proceed without the check.
- Find `CHANGELOG_LATEST_PUBLISHED` — the topmost `## [X.Y.Z] - YYYY-MM-DD [PUBLISHED]` in `CHANGELOG.md`.
- Compare `NPM_LATEST` and `CHANGELOG_LATEST_PUBLISHED`:
  - **If they match**, continue.
  - **If `CHANGELOG_LATEST_PUBLISHED` is newer than `NPM_LATEST`** (e.g. CHANGELOG claims `5.2.0 [PUBLISHED]` but npm only has `5.1.1`), CHANGELOG is overclaiming. Stop and report:
    - List every CHANGELOG `[PUBLISHED]` version newer than `NPM_LATEST`.
    - Ask the user whether to (a) re-publish those versions to npm before continuing, or (b) un-mark them in CHANGELOG (remove `[PUBLISHED]`, optionally merging the bullets back into `[Unreleased]`).
    - Do not auto-fix; this is a writing decision.
    - **Note on rc visibility:** rcs published with `--tag next` (or any non-`latest` dist-tag) won't show up in `dist-tags.latest`. If a CHANGELOG `[PUBLISHED]` rc isn't in `dist-tags.latest`, also check `dist-tags.next` / `dist-tags.rc` before flagging it as drift. The `versions` object lists every published version regardless of tag — use that as the fallback existence check for rcs.
  - **If `NPM_LATEST` is newer than `CHANGELOG_LATEST_PUBLISHED`**, npm has a version not reflected locally. Stop and ask the user to manually add a `## [NPM_LATEST] - <publish-date> [PUBLISHED]` heading to CHANGELOG before rerunning.
- Also sanity-check `PKG_VERSION` against the others. The expected state is `PKG_VERSION == NPM_LATEST == CHANGELOG_LATEST_PUBLISHED` for a plain release, or `PKG_VERSION` is an rc whose base `X.Y.Z` is newer than those (when iterating rcs). If `PKG_VERSION` is at neither the published version nor a forward rc, stop and report — something was edited manually.

### 1. Sanity checks

- Run `git status`. If the working tree has uncommitted changes **other than** `package.json`, `CHANGELOG.md`, `README.md` (which you're about to touch), warn and ask before continuing. Ignore changes under `example/`, `example-history/`, `svelte-spa-router-showcase/` for this check — they're separate apps.
- Confirm the `## [Unreleased]` section has at least one bullet of substantive content under `### Added`, `### Changed`, `### Fixed`, or `### Removed`. If empty, stop — there's nothing meaningful to release.

### 2. Compute `NEW_VERSION` and confirm if needed

Apply the version logic from the argument table above. The only branch that requires user confirmation **before** mutating files:

- **`rc` on a plain `X.Y.Z` package.json**: default to `X.(Y+1).0-rc01` and ASK: _"Starting a new rc cycle. Default is `<X.(Y+1).0-rc01>`. Confirm, or pick `patch` / `major` instead?"_ Wait for the answer; compute accordingly.

All other branches are deterministic — no prompt needed.

### 3. Bump `package.json`

If `NEW_VERSION != PKG_VERSION`, edit `package.json`:

```
"version": "PKG_VERSION"   →   "version": "NEW_VERSION"
```

Don't touch anything else in `package.json` — not `dependencies`, not `devDependencies`, not `exports`, not `files`. If you notice something that needs to change in those, raise it as a separate concern after the publish prep, don't bundle it into this commit.

### 4. Finalize CHANGELOG

In `CHANGELOG.md`:

- Rename `## [Unreleased]` → `## [NEW_VERSION] - YYYY-MM-DD [PUBLISHED]` (today's date — pull from system context, don't guess).
- Leave the bullet content under the renamed heading untouched.
- Insert a fresh `## [Unreleased]` block at the very top of the changelog (above the just-renamed heading), with empty subsections:

```
## [Unreleased]

### Added

### Changed

### Fixed
```

### 5. Refresh README "What's new"

In `README.md`:

- Find the `## What's new` heading just below the intro/badges. Below it are `### vX.Y.Z` subsections, each with bullet highlights for that release. There should be 0–2 of them.
- Add a new `### vNEW_VERSION` subsection at the top (just above the most recent existing one, still under the `## What's new` heading).
- Populate it with **3–6 concise bullets** summarising the most user-facing changes from the just-finalised CHANGELOG section. Prioritise: **Breaking/Removed** > **Added** > **Changed** > **Fixed** (mention non-trivial fixes, group small ones into a single "Several router fixes" bullet like the existing rc02 block does).
- After adding the new subsection, **delete older ones so only the two most recent remain** (the new one plus the one before it). The user has been explicit about this max-two rule — see `feedback_whats_new_block.md` in memory. Don't accumulate.
- If there were 0 prior subsections, that's fine — the new one becomes the only one.
- Don't touch the `Full details in [CHANGELOG.md](./CHANGELOG.md).` line at the end of the section.

### 6. Validate README reflects CHANGELOG

Read both the finalised CHANGELOG section and the new README `### vNEW_VERSION` subsection. Every **Removed/Breaking**, **Added**, or substantive **Changed** CHANGELOG bullet that represents a user-facing feature or behaviour change should have a corresponding hit in the README block (paraphrased, not verbatim). Pure internal refactors and small Fixed-only entries can be grouped or omitted.

If a significant CHANGELOG entry isn't reflected, add a bullet for it. If you end up with more than ~6 bullets after this pass, condense — the section should be scannable.

### 7. Validate CHANGELOG matches recent work

Run `git log --oneline` from the previous published version's commit (find the previous `## [X.Y.Z] - YYYY-MM-DD [PUBLISHED]` heading in `CHANGELOG.md` to anchor the range — usually `git log <prev-version-commit>..HEAD`, where the prev commit is found via `git log --oneline --grep=<prev-version>` or just by reading the commit list). Also `git diff` for uncommitted work in `src/lib/` (changes under `example*/` / `svelte-spa-router-showcase/` don't need CHANGELOG coverage).

For every substantive commit or uncommitted change in `src/lib/`, verify the CHANGELOG section now under the renamed heading mentions it. If something significant is missing, **stop and ask the user** before finalising — don't invent entries on their behalf.

### 8. Run validation

In repo root, run **in parallel** where possible:

- `npm run lint` — must pass clean (eslint over `.js`, `.svelte`, `.html`).
- `npm test` — all vitest cases must pass.
- `npm run test:e2e` — Playwright e2e suite. **Slow** (auto-starts the example dev server on port 5050). If a previous step or another dev session already has port 5050 in use, Playwright reuses it — that's fine. If e2e is genuinely too expensive for the current iteration (e.g. you're on the third rc bump of the day and nothing in `src/lib/` changed), ask the user whether to skip just this run; default is to run it.

If any fail, stop and report. Don't try to "fix and continue" without telling the user — a failed lint or test means the release isn't ready.

**Not run automatically** but worth mentioning if anything looked off in step 7: `npm pack --dry-run` will print the exact file list that would be uploaded. Useful if a new top-level file (e.g. a new doc, a new helper module outside `src/lib/`) was added in this release and you want to confirm it's covered by `files:` in `package.json`. Suggest it to the user if relevant; don't run unprompted.

### 9. Commit

Stage `package.json`, `CHANGELOG.md`, `README.md`. Create a commit using a HEREDOC for the message:

```
vNEW_VERSION — <one-line summary of the release's headline change>

<2–4 line description of what this version delivers, drawn from the CHANGELOG highlights>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Match whatever Co-Authored-By convention shows up in recent commits (`git log -5`) — don't introduce or strip one against the local style. The existing commit `fedc03b v5.2.0-rc02 — bug bash: 7 fixes, e2e suite, API additions` is a good template for the subject line shape.

### 10. Report

Report back with:

- The new version number (`vX.Y.Z` or `vX.Y.Z-rcNN`)
- The commit SHA
- A note if the npm sync check surfaced any drift the user had to resolve before this run.
- Exactly what the user needs to run to publish, in this order:
  ```
  npm publish              # for stable releases (publishes to dist-tags.latest)
  # — OR —
  npm publish --tag next   # for rc releases (keeps dist-tags.latest pointing at the last stable)

  git tag vNEW_VERSION
  git push origin <branch> vNEW_VERSION
  ```
  Pick the right `npm publish` line based on whether `NEW_VERSION` contains `-rc` — show only the relevant one, but keep the comment so the user knows the convention. Scoped packages (`@keenmate/...`) need `--access public` on the very first publish only; the package is already public, so don't include the flag.
- A reminder that if `npm publish` fails:
  - `package.json` is already at `NEW_VERSION` and CHANGELOG already says `[PUBLISHED]` — neither matches reality yet.
  - They should either retry the publish (no file changes needed if npm transiently failed or 2FA timed out), OR revert the commit (or at minimum: revert `package.json` to `PKG_VERSION` and rename the CHANGELOG heading back to `## [Unreleased]`, dropping `[PUBLISHED]`) before attempting a different release.
  - The new empty `## [Unreleased]` block above can stay either way — it becomes the next release's WIP.

## Things not to do

- **Do not run `npm publish`.** The user publishes manually (npm OTP / 2FA prompt).
- **Do not push to git remote.** The commit stays local until the user pushes.
- **Do not tag.** The user tags after a successful `npm publish` — a failed publish would otherwise leave an orphan tag.
- **Do not skip the npm sync check (step 0).** Drift between CHANGELOG and the npm registry is the single most common source of confused future publishes; catching it before the next release is the whole point.
- **Do not invent CHANGELOG entries** to cover commits you find — ask the user if something's missing.
- **Do not touch publish dates on prior `## [...]` headings**, even to "normalise" them.
- **Do not exceed two `### vX.Y.Z` subsections under `## What's new` in the README.** Delete the oldest to make room. See `feedback_whats_new_block.md` in memory for the rationale.
- **Do not run lint / tests / builds under `example/`, `example-history/`, or `svelte-spa-router-showcase/`** — they're separate apps and aren't published.
- **Do not run a "build step" for the library.** The package is distributed as source — `npm pack` reads the `files:` field directly. Any `tsc` / `vite build` / `svelte-package` invocation against the library root is wrong.
- **Do not auto-fix npm sync drift** — adding/removing `[PUBLISHED]` tags or merging bullets back into `[Unreleased]` is a writing decision, not a mechanical one.
- **Do not switch the rc format** from `-rcNN` (zero-padded, no dot) to `-rc.N` even though npm accepts both. The whole repo history uses the former.
