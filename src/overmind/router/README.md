# Overmind Router Documentation

A lightweight, state machine-driven router for Overmind applications with TypeScript support.

## Features

- 🚀 **State Machine Driven** - Uses XState-like patterns for reliable navigation states
- 🔄 **Bidirectional Routing** - URL changes update components, component actions update URL
- 📝 **TypeScript Support** - Fully typed route parameters and state
- 🎯 **Route Parameters** - Dynamic route segments and query parameters
- ⚡ **Zero Dependencies** - Built specifically for Overmind
- 🧪 **Well Tested** - Comprehensive test suite included
- 🔍 **Devtools Integration** - Full visibility into router state machine transitions via Overmind devtools

## Quick Start

1. [Setup and Configuration](./docs/SETUP.md)
2. [Basic Usage](./docs/USAGE.md)
3. [API Reference](./docs/API.md)
4. [Examples](./docs/EXAMPLES.md)

## Basic Example

```tsx
// 1. Define routes
const routes = {
  '/': { name: 'home' },
  '/users/:id': { name: 'userDetail' },
  '/users/:id/edit': { name: 'userEdit' }
}

// 2. Initialize router
actions.router.initializeRouter(routes)

// 3. Navigate in components
actions.router.navigateTo({
  pattern: '/users/:id',
  routeParams: { id: '123' }
})

// 4. Access current route
const { router } = useAppState()
if (router.current === 'ROUTER_READY') {
  const { pattern, routeParams } = router.currentRoute
}
```

## State Machine States

- `ROUTER_INITIAL` - Router not yet initialized
- `ROUTER_READY` - Router ready, route loaded
- `NAVIGATION_IN_PROGRESS` - Navigation happening
- `ROUTE_NOT_FOUND` - Invalid route
- `NAVIGATION_FAILURE` - Navigation error

## Project Structure

```sh
src/overmind/router/
├── router.state.ts      # State machine definition
├── router.actions.ts    # Navigation actions
├── router.effects.ts    # Browser API integration
├── index.ts             # Router module exports
└── docs/                # Documentation
```

## Developer Experience

The router integrates seamlessly with **Overmind DevTools**, providing complete visibility into:

- **State Machine Transitions** - Watch router states change in real-time
- **Action Triggers** - See exactly which actions cause navigation
- **Route Data** - Inspect current route parameters and query strings
- **Navigation Flow** - Debug the complete navigation lifecycle
- **Error States** - Track navigation failures and route not found scenarios

This makes debugging routing issues straightforward, as you can observe the entire router state machine alongside your application state in the same devtools interface.

## TODO: Future Enhancements

### Security Features

- **Route Guards & Permissions**

  ```typescript
  const routes = {
    '/admin': {
      name: 'admin',
      requiresAuth: true,
      requiredRoles: ['admin'],
      permissions: ['admin.read']
    },
    '/users/:id/edit': {
      name: 'userEdit',
      requiresAuth: true,
      guard: (user, params) => user.id === params.id || user.hasRole('admin')
    }
  }
  ```

- **Authentication Integration**
  - Automatic redirect to login for protected routes
  - Return URL preservation after authentication
  - Session timeout handling with route restoration

- **CSRF Protection**
  - Anti-CSRF token validation for state-changing routes
  - Secure navigation context verification

### Advanced Route Patterns

- **Regex Pattern Support**

  ```typescript
  const routes = {
    '/api/v[1-9]/users/:id': { name: 'apiUser', regex: true },
    '/files/\\d{4}/\\d{2}/.*': { name: 'filesByDate', regex: true }
  }
  ```

- **Wildcard/Catch-All Routes**

  ```typescript
  const routes = {
    '/docs/*': { name: 'docsWildcard', catchAll: true },
    '/legacy/**': { name: 'legacyRedirect', redirect: '/new-app/*' },
    '/*': { name: 'notFound', fallback: true } // Must be last
  }
  ```

- **Route Aliases & Redirects**

  ```typescript
  const routes = {
    '/profile': { name: 'userProfile', alias: ['/me', '/account'] },
    '/old-path': { name: 'redirect', redirectTo: '/new-path' },
    '/users/:id/profile': { name: 'userDetail', canonical: true }
  }
  ```

### Performance & Developer Experience

- **Route Preloading**
  - Predictive route preloading based on user behavior
  - Component lazy loading with route-based code splitting

- **Route Transitions**
  - Animated transitions between routes
  - Loading states with progress indicators

### Type Safety Enhancements

- **Strongly Typed Route Parameters**

  ```typescript
  interface RouteMap {
    '/users/:id': { id: string }
    '/posts/:postId/comments/:commentId': { postId: string; commentId: string }
  }

  // Compile-time route validation
  actions.router.navigateTo<'/users/:id'>({
    pattern: '/users/:id',
    routeParams: { id: '123' } // TypeScript enforces correct params
  })
  ```

- **Route Parameter Validation**

  ```typescript
  const routes = {
    '/users/:id': {
      name: 'userDetail',
      params: {
        id: { type: 'number', min: 1 },
        tab: { type: 'string', enum: ['profile', 'settings', 'posts'] }
      }
    }
  }
  ```

### Browser Integration

- **URL Fragment Handling**
  - Hash-based routing support
  - Scroll-to-element functionality

- **History Management**
  - Custom history manipulation
  - Route state persistence across sessions

These enhancements would make the router more enterprise-ready while maintaining its simplicity and state machine approach.
