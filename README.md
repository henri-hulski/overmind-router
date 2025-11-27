# Overmind Router Monorepo

A lightweight, state machine-driven router for Overmind applications with TypeScript support.

## Features

- 🚀 **State Machine Driven** - Uses Overmind state machine patterns for reliable navigation states
- 🔄 **Bidirectional Routing** - URL changes update components, component actions update URL
- 📝 **TypeScript Support** - Fully typed route parameters and state
- 🎯 **Route Parameters** - Dynamic route segments and query parameters
- 🔐 **Route Guards** - Built-in authentication and authorization support
- 🛡️ **Route Access Control** - `requiresAuth` and custom `guard` function
- ⚡ **Zero Dependencies** - Built specifically for Overmind
- 🧪 **Well Tested** - Comprehensive test suite included
- 🔍 **Devtools Integration** - Full visibility into router state machine transitions via Overmind devtools

## Quick Start

1. [Overmind Router](./packages/router/README.md)
2. [Setup and Configuration](./docs/setup.md)
3. [Basic Usage](./docs/usage.md)
4. [API Reference](./docs/api.md)
5. [Examples](./docs/examples.md)
6. [Example App](./packages/example-app/README.md)

## Monorepo Structure

```sh
├── packages/
│   ├── router/
│   │   ├── src/
│   │   │   ├── router.state.ts      # State machine definition
│   │   │   ├── router.actions.ts    # Navigation actions
│   │   │   ├── router.effects.ts    # Browser API integration
│   │   │   └── index.ts             # Router module exports
│   └── example-app/                 # Example application
└── docs/                            # Documentation
```
