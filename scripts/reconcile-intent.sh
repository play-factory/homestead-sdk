#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DECLARATIVE_SOFTWARE_HOME:-}" ]]; then
  echo "DECLARATIVE_SOFTWARE_HOME must point to an authorized external declarative-software checkout." >&2
  exit 1
fi

declarative_software_home="$(cd "$DECLARATIVE_SOFTWARE_HOME" && pwd -P)"
runner="${declarative_software_home}/src/cli.ts"
if [[ ! -f "$runner" ]]; then
  echo "Declarative software runner not found at $runner" >&2
  exit 1
fi

repository="$(cd "$(git rev-parse --show-toplevel)" && pwd -P)"

resolve_external_path() {
  local requested="$1" label="$2"
  if [[ "$requested" != /* ]]; then
    echo "$label must be an absolute path." >&2
    exit 1
  fi
  node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const [requested, repository, label] = process.argv.slice(1);
    let cursor = path.resolve(requested);
    const suffix = [];
    while (!fs.existsSync(cursor)) {
      const parent = path.dirname(cursor);
      if (parent === cursor) throw new Error(`Unable to resolve ${label}`);
      suffix.unshift(path.basename(cursor));
      cursor = parent;
    }
    const resolved = path.resolve(fs.realpathSync.native(cursor), ...suffix);
    const within = (base, candidate) => {
      const relative = path.relative(base, candidate);
      return !relative || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
    };
    if (within(repository, resolved) || within(resolved, repository)) {
      console.error(`${label} must remain disjoint from the target repository, including through symlinks.`);
      process.exit(1);
    }
    process.stdout.write(resolved);
  ' "$requested" "$repository" "$label"
}

state="$(resolve_external_path "${DECLARATIVE_SOFTWARE_STATE_HOME:-${HOME}/.declarative-software/swarms}/homestead-sdk" DECLARATIVE_SOFTWARE_STATE_HOME)"
output="$(resolve_external_path "${DECLARATIVE_SOFTWARE_OUTPUT_HOME:-${HOME}/.declarative-software/runs}/homestead-sdk" DECLARATIVE_SOFTWARE_OUTPUT_HOME)"
case "$state" in "$output"|"$output"/*) echo "Retained state and run output must not overlap." >&2; exit 1;; esac
case "$output" in "$state"|"$state"/*) echo "Retained state and run output must not overlap." >&2; exit 1;; esac

for argument in "$@"; do
  case "$argument" in
    --state|--state=*|--config|--config=*|--model|--model=*|--effort|--effort=*|--codex|--codex=*|--output|--output=*|--allow-deployment)
      echo "The repository wrapper owns state, output, configuration, model, effort, Codex, and deployment policy; do not override $argument." >&2
      exit 1
      ;;
  esac
done

case "$(node "$runner" --help)" in
  *--allow-deployment*) ;;
  *)
    echo "The declarative-software checkout is too old: deployment must be disabled by default." >&2
    exit 1
    ;;
esac

cd "$declarative_software_home"
exec node "$runner" "$repository" --state "$state" --output "$output" --approve "$@"
