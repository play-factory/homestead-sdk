# Homestead SDK/CLI Agent Instructions

This public repo hosts the Homestead TypeScript SDK/API client and Homestead CLI. Keep it safe for npm consumers and free of private `home-os` implementation details except when explicitly documenting extraction source context.

## Worktree workflow

- Do not edit `main` directly for implementation work.
- Create or switch to a dedicated git worktree and feature branch before editing.
- Keep commits scoped to that worktree.
- Use `main` only for read-only inspection, sync, merge/rebase, or repository maintenance unless the user explicitly approves otherwise.

## Architecture standards

- Prefer functional core / imperative shell.
- Keep parsing, command planning, rendering, API-operation decisions, and error mapping in pure, deterministic modules.
- Keep filesystem, network, process env, stdin/stdout/stderr, browser auth flows, clocks, and token storage at shell boundaries.
- The CLI must use the workspace SDK/API client for Homestead HTTP calls; do not duplicate HTTP logic in CLI modules.
- Vendor generated API types/client artifacts unless this public repo explicitly gains a sanitized OpenAPI artifact generation path.

## TypeScript and boundary parsing

- Use strict TypeScript.
- Do not use `any`; isolate and justify unavoidable library-boundary exceptions.
- Avoid unsafe casts; validate unknown external data before it reaches core logic.
- Prefer precise domain types and discriminated unions for command results, errors, and exit states.
- Parse boundaries with Zod or equivalent explicit parsers:
  - config files and stored credentials
  - environment variables
  - API responses not already typed/validated by the generated client
  - stdin and CLI input payloads where appropriate

## Auth and security

- Clerk-backed device login is the preferred interactive CLI login path.
- Raw API-token login (`HOMESTEAD_API_TOKEN`, `--token`, `--token-stdin`) is legacy/recovery/test automation only.
- Public docs must not promote pasting raw tokens as the default path.
- Never log, print, commit, or summarize bearer tokens, setup tokens, rotated tokens, provider credentials, private home data, or raw API responses containing private values.

## Testing expectations

For behavior changes, use TDD when practical. Add or preserve tests for:

- parser behavior
- config/store parsing and persistence
- render/output behavior
- network and API error mapping
- auth/device-login flow with filesystem, browser, timing, and network effects stubbed

Run focused tests as packages come online, then `pnpm build`, `pnpm typecheck`, `pnpm test`, and package dry-runs before publishing changes.

## Public repo hygiene

- Do not copy secrets, local env files, `.wrangler` secrets, private deployment notes, or internal-only dashboard/backend docs.
- Keep package `files` fields or `.npmignore` rules tight so npm packages publish only consumer-relevant artifacts.
- Keep README content public-facing: install, basic SDK usage, CLI login/device-login usage, default production API URL, and legacy-token caveats.
