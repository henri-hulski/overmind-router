# Setup and Configuration

This guide shows how to set up the Overmind router in your React application.

## 1. Installation

The router is included in this project. No additional packages needed.
You should copy the `router` module from the `overmind` directory to your project.

## 2. Define Routes

Create your route configuration:

```typescript
// src/routes.ts
import type { RoutesT } from './overmind/router/router.effects'

export const routes: RoutesT = {
  '/': { name: 'home' },
  '/clients': { name: 'clientList' },
  '/clients/new': { name: 'clientNew' },
  '/clients/:id': { name: 'clientDetail' },
  '/clients/:id/edit': { name: 'clientEdit' },
  '/login': { name: 'login' },
  '/users/:userId/profile': { name: 'userProfile' }
}
```

## 3. Initialize Router in Overmind

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

## 4. Connect to React Components

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

## 5. TypeScript Configuration

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
