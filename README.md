# Homestead SDK and CLI

Public TypeScript SDK/API client and command-line interface for Homestead.

This repository contains:

- `@homestead/sdk`: typed TypeScript SDK/API client for the Homestead API
- `@homestead/cli`: `homestead` command-line tool built on the SDK

The default production API base URL is `https://api.homestead.work`.

## Install

```sh
pnpm add @homestead/sdk
```

```sh
pnpm add -g @homestead/cli
# or
npx @homestead/cli --help
```

Package names are prepared for public npm publishing as `@homestead/sdk` and `@homestead/cli`.

## SDK usage

```ts
import { createHomesteadApiClient } from "@homestead/sdk";

const client = createHomesteadApiClient({
  baseUrl: "https://api.homestead.work",
  auth: { type: "anonymous" },
});

const result = await client.getHealth();
if (result.status === "error") {
  throw new Error(result.error.message);
}

console.log(result.value);
```

Interactive users should prefer CLI device login instead of manually handling raw API tokens.

## CLI usage

Check API health:

```sh
homestead health
homestead health --json
```

Log in interactively with Clerk-backed device approval:

```sh
homestead login
```

The CLI opens a browser approval URL, waits for Clerk-backed approval, and stores the approved scoped token in the local Homestead CLI config. After login:

```sh
homestead me --json
homestead homes --json
```

To target a non-default API server, pass `--base-url`:

```sh
homestead login --base-url http://localhost:8787
homestead health --base-url http://localhost:8787
```

Raw token inputs (`HOMESTEAD_API_TOKEN`, `--token`, and `--token-stdin`) are retained only for legacy, recovery, and test automation scenarios. Public interactive docs should prefer `homestead login` device approval.

## Development

Use a feature worktree/branch for implementation work; do not edit `main` directly.

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm --filter @homestead/sdk exec npm pack --dry-run
pnpm --filter @homestead/cli exec npm pack --dry-run
```

The SDK currently vendors generated OpenAPI TypeScript types from the private source repository. Do not copy private deployment scripts, local secrets, or internal-only backend/dashboard documentation into this public repo.
