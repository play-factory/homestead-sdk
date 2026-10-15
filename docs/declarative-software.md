# Declarative software workflow

This repository is managed against the human-owned desired state in [`.intent/`](../.intent/). Declarations describe consumer outcomes and intentional constraints; they are not a roadmap, generated backlog, or snapshot of whatever the current implementation happens to do.

Observed regressions belong in `.bugs/` as Markdown reports containing what happened, what was expected, reproduction steps, and available evidence. Never place credentials, raw private API responses, household data, or private service implementation details in declarations, bug reports, or run artifacts intended for publication.

## One-time harness setup

Use a separate checkout of [`superrare/declarative-software`](https://github.com/superrare/declarative-software). The harness repository is private, so this workflow requires a GitHub account with access:

```sh
git clone https://github.com/superrare/declarative-software.git ~/Projects/declarative-software
(
  cd ~/Projects/declarative-software
  npm install
  ./node_modules/.bin/codex login
)
export DECLARATIVE_SOFTWARE_HOME="$HOME/Projects/declarative-software"
```

The harness requires Node.js 22.18 or newer, an authenticated bundled Codex CLI, and a version whose `--help` exposes `--allow-deployment`; the wrapper fails closed against older deployment-capable versions. This repository requires Node.js 24 or newer, so use Node.js 24+ for the complete workflow. Keep the private harness checkout, retained state, and run output outside this public repository.

Install Corepack into the user-local prefix, then enable it and activate the pnpm version declared by this repository:

```sh
npm install --global corepack@0.36.0 --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
corepack enable --install-directory "$HOME/.local/bin"
corepack install
pnpm --version
```

## Reconcile the SDK and CLI

Start from a clean, up-to-date `main` checkout. Do not run two controllers against the same state directory.

```sh
before="$(git rev-parse HEAD)"
export DECLARATIVE_SOFTWARE_HOME=~/Projects/declarative-software
pnpm reconcile
```

The wrapper uses `~/.declarative-software/swarms/homestead-sdk` for retained state and `~/.declarative-software/runs/homestead-sdk` for run output by default. Override their parent directories with absolute `DECLARATIVE_SOFTWARE_STATE_HOME` and `DECLARATIVE_SOFTWARE_OUTPUT_HOME` paths. The wrapper physically resolves existing paths and symlink ancestors and rejects locations inside the target repository. It also rejects caller overrides for `--state`, `--output`, `--config`, `--model`, `--effort`, `--codex`, and `--allow-deployment`, so reconciliation cannot deploy or publish through an agent-supplied plan or a repository release contract. Other non-conflicting harness flags may be appended:

```sh
pnpm reconcile --depth deep --max-peers 4 --max-duration 60m
```

The harness may initialize its external retained state and isolated worktree before presenting a proposal. The committed configuration and wrapper require approval before implementation changes begin. Review the proposal, cited declarations, public-repository boundaries, observed evidence, verification plan, and pre-existing changes before approving it.

## Review and publish reconciled work

After you approve a proposal and the resulting work passes independent verification, the runner automatically merges the verified candidate commits into the local `main` branch. The wrapper keeps the framework's formal deployment mechanisms disabled and does not push commits or publish packages. Reconciliation agents still have shell and network access, so run them without registry publishing credentials; package release remains a separate operator action through the normal workflow.

1. Inspect the run summary and retained evidence under the external state directory and the per-run artifacts under the external output directory.
2. Review the exact pre-run-to-post-run range with `git log --oneline "$before"..main` and `git diff "$before"..main`; confirm `.intent/` was not changed by reconciliation.
3. Run `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm pack:dry-run`.
4. Inspect both dry-run package manifests and file listings for missing runtime files or accidental private content.
5. Review `.bugs/` dispositions against reproductions and regression evidence.
6. Publish the reviewed commits through the repository's normal Git/PR controls; release packages only through the normal release workflow.

Edit `.intent/` only as a deliberate human product decision, landed on `main` through the normal branch/PR workflow while no reconciler is actively guarding the checkout. Keep private service implementation details in the private service repository; this repository's declaration is authoritative only for the public SDK and CLI experience.
