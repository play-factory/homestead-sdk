#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DECLARATIVE_SOFTWARE_HOME:-}" ]]; then
  printf '%s\n' 'DECLARATIVE_SOFTWARE_HOME must point to a declarative-software checkout.' >&2
  exit 1
fi

if [[ ! -d "$DECLARATIVE_SOFTWARE_HOME" ]]; then
  printf 'Declarative software checkout not found: %s\n' "$DECLARATIVE_SOFTWARE_HOME" >&2
  exit 1
fi

declarative_software_home="$(cd "$DECLARATIVE_SOFTWARE_HOME" && pwd -P)"
runner="${declarative_software_home}/src/cli.ts"
if [[ ! -f "$runner" ]]; then
  printf 'Declarative software runner not found: %s\n' "$runner" >&2
  exit 1
fi

repository="$(git rev-parse --show-toplevel)"
state_home="${DECLARATIVE_SOFTWARE_STATE_HOME:-${HOME}/.declarative-software/swarms}"
if [[ "$state_home" != /* ]]; then
  printf '%s\n' 'DECLARATIVE_SOFTWARE_STATE_HOME must be an absolute path.' >&2
  exit 1
fi
state="${state_home}/homestead-sdk"

cd "$declarative_software_home"
exec node "$runner" "$repository" --state "$state" "$@"
