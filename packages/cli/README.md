# @homestead/cli

Command-line interface for Homestead.

## Install

```sh
pnpm add -g @homestead/cli
```

## Login

Use Clerk-backed device approval for normal interactive login:

```sh
homestead login
```

The CLI opens a browser approval URL and stores the approved scoped token locally. The default API base URL is `https://api.homestead.work`.

Use `--base-url` when targeting another API server:

```sh
homestead login --base-url http://localhost:8787
```

## Common commands

```sh
homestead health --json
homestead me --json
homestead homes --json
```

Raw token inputs (`HOMESTEAD_API_TOKEN`, `--token`, and `--token-stdin`) are legacy/recovery/test automation paths, not the recommended interactive login flow.
