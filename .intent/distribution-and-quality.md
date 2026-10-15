# Distribution and quality

## Public packages

- The SDK and CLI are independently buildable and installable packages prepared for public distribution under the names `@homestead/sdk` and `@homestead/cli`.
- Published packages contain only consumer-relevant compiled files, declarations, documentation, and licensing.
- The CLI installs a working `homestead` executable and resolves the matching workspace SDK without relying on the repository layout.

## Contract provenance

- Generated public API types and client artifacts are vendored and sanitized for public consumption.
- Published packages do not require private server source, credentials, deployment configuration, or internal-only documentation.
- A contract update includes compatibility review and tests demonstrating that generated and handwritten client behavior agree.

## Verification

- Strict TypeScript checks pass without weakening types to accommodate unknown data.
- Unit tests cover pure core behavior; adapter tests cover network, filesystem, browser, terminal, and configuration boundaries.
- Package builds succeed from a clean checkout.
- Dry-run package manifests are reviewed to prevent missing runtime files and accidental publication of private or development-only material.
- Public examples and agent instructions are reviewed and updated against the supported command and client surface when behavior changes.
- Before publishing either package, its build, typecheck, tests, and dry-run package-content review complete successfully.
