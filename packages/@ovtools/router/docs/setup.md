# Setup and Configuration

This guide shows how to set up the Overmind router in your React application.

## 1. Installation

Install Overmind Router from npm with:

```sh
npm install @ovtools/router
```

## 2. Define Routes

Create your route configuration with authentication and authorization:

```typescript
// src/routes.ts
import type { RoutesT } from '@ovtools/router'

import type { UserT } from './overmind/auth/auth.effects'

// Guard functions
const hasAdminRole = (user: UserT | null) => !!(user && user.isAdmin)
const hasManagerRole = (user: UserT | null) =>
  !!(user && (user.isAdmin || user.isManager))

export const routes: RoutesT = {
  '/': {
    params: []
  },
  '/login': {
    params: []
  },
  '/clients': {
    params: ['search', 'page'],
    requiresAuth: true
  },
  '/clients/new': {
    params: [],
    requiresAuth: true,
    guard: hasManagerRole
  },
  '/clients/:id': {
    params: ['tab'],
    requiresAuth: true
  },
  '/clients/:id/edit': {
    params: [],
    requiresAuth: true,
    guard: hasManagerRole
  },
  '/admin': {
    params: [],
    requiresAuth: true,
    guard: hasAdminRole
  }
}
```

### Route Properties

- **`params`** - Array of expected query parameter names
- **`requiresAuth`** - Boolean indicating if route requires authentication (default: `false`)
- **`guard`** - Function to check authorization (receives user, returns boolean)

## 3. Mount Router under Overmind namespace

Mount the Router in the Overmind setup under `router` or any other namespace:

```typescript
// src/overmind/index.ts
import { type IContext } from 'overmind'
import { router } from '@ovtools/router'
import { namespaced } from 'overmind/config'

import * as app from './app'

export const config = namespaced({
  app,
  // ... other namespace mount points
  router // or `myRouter: router` for custom namespace
})

export type Context = IContext<typeof config>
```

## 4. Initialize Router in Overmind

Add router initialization to your app's startup:

```typescript
// src/overmind/app/app.actions.ts
import type { Context } from '..'
import { routes } from '../../routes'

export const onInitializeOvermind = async ({ actions }: Context) => {
  // Initialize router with your routes
  actions.router.initializeRouter(routes)

  // Set up browser navigation (back/forward buttons)
  window.addEventListener('popstate', () => {
    actions.router.onPopState()
  })
}
```

## 5. Connect to React Components

Create your main App component to respond to route changes:

```tsx
// src/components/App/index.tsx
import React, { useEffect } from 'react'

import { useActions, useAppState } from '../../overmind'

export default function App() {
  const { router, app } = useAppState()
  const actions = useActions()

  useEffect(() => {
    if (app.current === 'APP_INITIAL') {
      actions.app.onInitializeOvermind()
    }
  }, [app.current, actions.app])

  // Handle loading states
  if (app.current === 'APP_INITIAL' || router.current === 'ROUTER_INITIAL') {
    return <div>Loading...</div>
  }

  // Handle router errors
  if (router.current === 'ROUTE_NOT_FOUND') {
    return (
      <div>
        <h1>Page Not Found</h1>
        <button onClick={() => actions.router.navigateTo({ pattern: '/' })}>
          Go Home
        </button>
      </div>
    )
  }

  if (router.current !== 'ROUTER_READY' || !router.currentRoute) {
    return <div>Loading...</div>
  }

  const { pattern, routeParams } = router.currentRoute

  return (
    <div className="app">
      {/* Navigation */}
      <nav>
        <button onClick={() => actions.router.navigateTo({ pattern: '/' })}>
          Home
        </button>
        <button
          onClick={() => actions.router.navigateTo({ pattern: '/clients' })}
        >
          Clients
        </button>
      </nav>

      {/* Route-based rendering */}
      <main>
        {pattern === '/' && <HomePage />}
        {pattern === '/clients' && <ClientList />}
        {pattern === '/clients/new' && <ClientNew />}
        {pattern === '/clients/:id' && routeParams?.id && (
          <ClientDetail clientId={parseInt(routeParams.id)} />
        )}
        {pattern === '/clients/:id/edit' && routeParams?.id && (
          <ClientEdit clientId={parseInt(routeParams.id)} />
        )}
      </main>
    </div>
  )
}
```

## 6. TypeScript Configuration

Ensure your `tsconfig.json` includes the router types:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"]
}
```

## Where to go next

- [Overview](../README.md)
- [Learn basic usage patterns](./usage.md)
- [Check the API reference](./api.md)
- [See complete examples](./examples.md)
