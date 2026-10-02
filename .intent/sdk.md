# TypeScript SDK

## Client behavior

- Consumers can create a Homestead client with an explicit base URL and authentication mode.
- The default production service is `https://api.homestead.work`.
- Supported API operations have precise request, response, success, and error types derived from the versioned public contract.
- The client validates response boundaries where generated static types alone cannot establish runtime safety.
- HTTP, API, authentication, validation, and network failures are distinguishable without requiring consumers to parse ad hoc message strings.
- Operations return explicit result values rather than hiding expected service failures in untyped exceptions.

## Safety and compatibility

- Authentication is applied only to intended requests and secrets are never included in diagnostics or rendered errors.
- URLs, headers, and request bodies are constructed deterministically and safely from typed inputs.
- Changes to the public API contract are reflected in generated client types and reviewed for consumer compatibility.
- Existing supported consumers should not break without an intentional versioned change and migration guidance.
- The package has no dependency on private `home-os` source files at install or runtime.

## Consumer experience

- The package exports the documented client, types, and error/result vocabulary from stable entry points.
- Documentation includes an install path and a minimal working example using the production API.
- Package contents are limited to the compiled runtime, type declarations, license, and consumer-facing documentation required to use the SDK.
