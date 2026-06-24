# @homestead/sdk

Typed TypeScript SDK/API client for the Homestead API.

## Install

```sh
pnpm add @homestead/sdk
```

## Usage

```ts
import { createHomesteadApiClient } from "@homestead/sdk";

const client = createHomesteadApiClient({
  baseUrl: "https://api.homestead.work",
  auth: { type: "anonymous" },
});

const health = await client.getHealth();
```

For authenticated calls, pass bearer auth from a trusted token source. Interactive users should prefer `homestead login` from `@homestead/cli`.
