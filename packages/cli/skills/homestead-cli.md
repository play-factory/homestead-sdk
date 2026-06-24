# Homestead CLI guide for agents

Use the `homestead` CLI to inspect and operate Homestead through the public SDK/API client. The CLI is API-first and should be pointed at the intended API server explicitly when automation is unsure.

## Engineering rules

- Keep command parsing, planning, output rendering, config interpretation, and API-operation decisions in pure core modules.
- Keep filesystem, process env, stdout/stderr, stdin, browser opening, timers, and network calls in adapters/shell modules.
- Use the SDK/API client package for Homestead HTTP calls; do not duplicate HTTP request logic in CLI code.
- Use strict TypeScript with no `any`; validate unknown boundary input with Zod or equivalent parsers.
- Prefer discriminated unions for command results, domain errors, and exit states.

## Safety rules

- Never print, log, commit, or summarize bearer tokens, setup tokens, rotated tokens, provider credentials, emails, or private home data.
- Prefer Clerk-backed device login (`homestead login`) for interactive or agent-assisted workflows.
- Do not ask users to paste raw `hos_...` API tokens. `HOMESTEAD_API_TOKEN`, `--token`, and `--token-stdin` are legacy/recovery/test automation paths only.
- Use `--json` for machine-readable output.
- Treat nonzero exit codes as failures; auth-required exits with code `3`.

## API URL selection and login

```sh
homestead health --base-url http://localhost:8787
homestead health --base-url https://api.homestead.work
```

For repeated interactive use, save a Clerk-approved device login. This opens a browser approval URL, requires the user to sign in with Clerk, and stores the approved scoped token locally:

```sh
homestead login --base-url https://api.homestead.work
```

Use a local API URL only when intentionally working against a local Homestead API:

```sh
homestead login --base-url http://localhost:8787
```

After login, prefer stored credentials and omit token flags:

```sh
homestead me --json
homestead homes --json
```

## Useful read-only commands

```sh
homestead health --json
homestead me --json
homestead homes --json
homestead notification-integrations --json
homestead reminder-deliveries <homeId> --limit 10 --json
```

## Notification and reminder operations

Configure email reminders without exposing provider credentials:

```sh
homestead set-email-notification --email owner@example.com --delivery-mode digest --json
homestead notification-integrations --json
```

Configure task reminder schedules. `--email-default` uses the default email reminder policy; custom rules use `frequency:start:end`, where offsets are days before due date.

```sh
homestead task-reminder-schedule <taskId> --json
homestead set-task-reminder-schedule <taskId> --email-default --json
homestead set-task-reminder-schedule <taskId> --channel email --rule weekly:14:7 --json
homestead delete-task-reminder-schedule <taskId> --json
```

Use reminder history to inspect operational status without exposing recipients or provider credentials:

```sh
homestead reminder-deliveries <homeId> --status failed --json
```

## Recurring tasks

Create recurring tasks with a due date plus a recurrence interval. Completing a recurring task records completion history and advances the next due date.

```sh
homestead create-task <homeId> --title "Clean front windows" --due-at 2026-06-16T13:00:00.000Z --repeat-every 1 --repeat-unit week --json
homestead update-task <taskId> --repeat-every 2 --repeat-unit weeks --json
homestead update-task <taskId> --clear-recurrence --json
```
