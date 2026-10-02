# Declarative software workflow

This repository is managed against the human-owned desired state in [`.intent/`](../.intent/). Declarations describe consumer outcomes and intentional constraints; they are not a roadmap, generated backlog, or snapshot of whatever the current implementation happens to do.

Observed regressions belong in `.bugs/` as Markdown reports containing what happened, what was expected, reproduction steps, and available evidence. Never place credentials, raw private API responses, household data, or private `home-os` implementation details in declarations, bug reports, or run artifacts intended for publication.

## One-time harness setup

Use a separate checkout of [`superrare/declarative-software`](https://github.com/superrare/declarative-software). The harness repository is private, so this workflow requires a GitHub account with access:

```sh
git clone https://github.com/superrare/declarative-software.git ~/Projects/declarative-software
cd ~/Projects/declarative-software
npm install
./node_modules/.bin/codex login
export DECLARATIVE_SOFTWARE_HOME="$PWD"
```

The harness requires Node.js 22.18 or newer and an authenticated bundled Codex CLI. This repository requires Node.js 24 or newer, so use Node.js 24+ for the complete workflow. Keep the private harness checkout and retained state outside this public repository.

## Reconcile the SDK and CLI

Start from a clean, up-to-date `main` checkout. Do not run two controllers against the same state directory.

```sh
export DECLARATIVE_SOFTWARE_HOME=~/Projects/declarative-software
pnpm reconcile
```

The wrapper uses `~/.declarative-software/swarms/homestead-sdk` by default. Override the parent directory with an absolute `DECLARATIVE_SOFTWARE_STATE_HOME` path. Additional harness flags may be appended:

```sh
pnpm reconcile --depth deep --max-peers 4 --max-duration 60m
```

The committed configuration requires approval before mutation. Review the proposal, cited declarations, public-repository boundaries, observed evidence, verification plan, and pre-existing changes before approving it.

## Review and publish reconciled work

After you approve a proposal and the resulting work passes independent verification, the runner automatically merges the verified candidate commits into the local `main` branch. It does not push those commits or publish packages.

1. Inspect the run summary and retained evidence under the external state directory.
2. Review the new local commits and their diffs, and confirm `.intent/` was not changed by reconciliation.
3. Run `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm pack:dry-run`.
4. Inspect both dry-run package manifests and file listings for missing runtime files or accidental private content.
5. Review `.bugs/` dispositions against reproductions and regression evidence.
6. Publish the reviewed commits through the repository's normal Git/PR controls; release packages only through the normal release workflow.

Edit `.intent/` only as a deliberate human product decision, landed on `main` through the normal branch/PR workflow while no reconciler is actively guarding the checkout. Keep private service implementation detail in `home-os`; this repository's declaration is authoritative only for the public SDK and CLI experience.
