# Command-line interface

## Interactive authentication

- `homestead login` is the normal interactive login path.
- Login starts a Clerk-backed device approval flow, opens or clearly presents the browser approval URL, waits safely for completion, and stores the approved Homestead credential plus the public connection and credential metadata needed to use it safely.
- Login does not retain Clerk sessions, intermediate approval secrets, or other browser-authentication material.
- Login communicates pending, denied, expired, cancelled, network-failure, and successful outcomes clearly.
- Stored configuration and credentials are parsed defensively and written with permissions appropriate for secrets.
- Raw token inputs are available only for explicit legacy, recovery, and test-automation scenarios and are not promoted as the default workflow.

## Commands and output

- The CLI exposes supported Homestead operations with discoverable help, consistent arguments, and actionable validation errors.
- Human-readable output is concise and safe by default.
- Commands that support automation preserve the established `--json` interface for stable JSON output and provide meaningful process exit status; authentication-required failures use exit code `3`.
- Raw-token recovery and test automation retain the established `HOMESTEAD_API_TOKEN`, `--token`, and `--token-stdin` interfaces.
- Without an explicit override, the CLI targets the documented production API at `https://api.homestead.work`; `--base-url` can target an explicitly chosen compatible service without silently changing that default.
- Commands do not print bearer tokens, stored credentials, private raw responses, or secrets in errors.
- Reminder-history output exposes operational status without recipient identifiers or provider credentials.

## Architecture and reliability

- CLI commands call the Homestead API through the workspace SDK rather than duplicating HTTP behavior.
- Parsing, command planning, rendering, recurrence/reminder input handling, and error mapping remain deterministic and independently testable.
- Completing recurring work through the CLI records completion history and advances the next due date according to the task's recurrence.
- Filesystem, browser, network, environment, time, stdin, stdout, and stderr are explicit adapters around the core.
- Interruptions and external failures leave configuration valid and do not claim that an operation completed when its outcome is unknown.

## Agent use

- `homestead skill homestead-cli` provides the canonical consumer-facing instructions for agents using the CLI.
- Agent guidance prefers safe, read-only discovery and device login, and never asks a person to disclose a raw token as the normal path.
