# Overmind Tools

Tools and libraries to enhance Overmind state management.
Includes example applications and documentation.

## Packages

- [Overmind Router](./packages/@ovtools/router/README.md) - Powerful state-machine driven router for Overmind applications.

## Example Applications

- [Router Example App](./examples/router-app/README.md) - Example application showcasing Overmind Router capabilities.

## Monorepo Structure

```sh
overmind-tools/
├── packages/                          # Overmind tools packages
│   ├── @ovtools/                      # @ovtools scoped packages
│   │   ├── router/                    # Overmind Router package
│   │   │   ├── docs/                  # Router documentation
│   │   │   ├── src/                   # Router source code
│   │   │   │   ├── router.state.ts    # State machine definition
│   │   │   │   ├── router.actions.ts  # Navigation actions
│   │   │   │   ├── router.effects.ts  # Browser API integration
│   │   │   └── index.ts               # Router module exports
├── examples/                          # Example applications
│   └── router-app/                    # Router example application
```
