# Homestead SDK and CLI purpose

This repository provides the public, supported programmatic interface to Homestead:

- `@homestead/sdk` gives TypeScript applications and agents a typed client for the Homestead API.
- `@homestead/cli` gives people and automation a safe command-line interface built on that SDK.

The packages make Homestead useful outside the first-party dashboard without duplicating backend behavior or exposing private service implementation details.

## Intended outcomes

- A TypeScript consumer can perform supported Homestead operations through a stable, typed, documented API client.
- A person can install the CLI, authenticate through a browser approval flow, and use clear commands for household operations.
- Automation can use explicit scoped credentials and machine-readable output without weakening the interactive user's security model.
- Package installation, upgrades, errors, and command behavior are predictable enough for scripts and agent tooling.

## Principles

- The public API contract, not the private server source tree, defines client behavior.
- The CLI uses the workspace SDK for HTTP calls and does not maintain a second client implementation.
- Pure parsing, planning, rendering, and error mapping are separated from network, filesystem, browser, environment, clock, and terminal effects.
- Unknown external data is validated before it reaches trusted domain logic.
- Public artifacts contain no private deployment notes, household data, credentials, or internal-only implementation details.
