# Examples

Practical examples of using the Overmind router in real applications.

## Complete App Setup

### 1. Route Definition

```typescript
// src/routes.ts
import type { RoutesT } from './overmind/router/router.effects'

export const routes: RoutesT = {
  '/': { name: 'home' },
  '/login': { name: 'login' },
  '/dashboard': { name: 'dashboard' },
  '/clients': { name: 'clientList' },
  '/clients/new': { name: 'clientNew' },
  '/clients/:id': { name: 'clientDetail' },
  '/clients/:id/edit': { name: 'clientEdit' },
  '/users/:userId/profile': { name: 'userProfile' },
  '/settings': { name: 'settings' }
}
```

### 2. App Initialization

```typescript
// src/overmind/app/app.actions.ts
import { routes } from '../../routes'

export const onInitializeOvermind = async ({ actions }: Context) => {
  // Initialize router first
  actions.router.initializeRouter(routes)

  // Set up browser navigation
  window.addEventListener('popstate', () => {
    actions.router.onPopState()
  })

  // Check authentication
  await actions.auth.checkSession()
}
```

### 3. Main App Component

```tsx
// src/components/App/index.tsx
import React, { useEffect } from 'react'

import { useActions, useAppState } from '../../overmind'
import { ClientDetail } from '../ClientDetail'
import { ClientEdit } from '../ClientEdit'
import { ClientList } from '../ClientList'
import { ClientNew } from '../ClientNew'
import { HomePage } from '../HomePage'
import { Login } from '../Login'
import { Navigation } from '../Navigation'

export default function App() {
  const { router, app } = useAppState()
  const actions = useActions()

  useEffect(() => {
    if (app.current === 'APP_INITIAL') {
      actions.app.onInitializeOvermind()
    }
  }, [app.current, actions.app])

  // Loading states
  if (app.current === 'APP_INITIAL' || router.current === 'ROUTER_INITIAL') {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Navigation in progress
  if (router.current === 'NAVIGATION_IN_PROGRESS') {
    return (
      <div className="app">
        <Navigation />
        <main className="main-content">
          <div className="navigation-loader">Navigating...</div>
        </main>
      </div>
    )
  }

  // Route not found
  if (router.current === 'ROUTE_NOT_FOUND') {
    return (
      <div className="app">
        <Navigation />
        <main className="main-content">
          <div className="error-page">
            <h1>Page Not Found</h1>
            <p>The path "{router.requestedPath}" was not found.</p>
            <button
              onClick={() => actions.router.navigateTo({ pattern: '/' })}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Navigation error
  if (router.current === 'NAVIGATION_FAILURE') {
    return (
      <div className="app">
        <Navigation />
        <main className="main-content">
          <div className="error-page">
            <h1>Navigation Error</h1>
            <p>{router.errorMsg}</p>
            <button
              onClick={() => actions.router.navigateTo({ pattern: '/' })}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Router ready - render routes
  if (router.current !== 'ROUTER_READY' || !router.currentRoute) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  const { pattern, routeParams } = router.currentRoute

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        {pattern === '/' && <HomePage />}
        {pattern === '/login' && <Login />}
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

## Navigation Component

```tsx
// src/components/Navigation/index.tsx
import React from 'react'

import { useActions, useAppState } from '../../overmind'

export const Navigation: React.FC = () => {
  const { router, auth } = useAppState()
  const actions = useActions()

  const currentPattern = router.currentRoute?.pattern
  const isAuthenticated = auth.current === 'AUTHENTICATED'

  if (!isAuthenticated) {
    return null // Don't show navigation when not logged in
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1
          onClick={() => actions.router.navigateTo({ pattern: '/' })}
          style={{ cursor: 'pointer' }}
        >
          My App
        </h1>
      </div>

      <div className="nav-links">
        <button
          onClick={() => actions.router.navigateTo({ pattern: '/' })}
          className={`nav-link ${currentPattern === '/' ? 'active' : ''}`}
        >
          Home
        </button>

        <button
          onClick={() => actions.router.navigateTo({ pattern: '/clients' })}
          className={`nav-link ${currentPattern === '/clients' ? 'active' : ''}`}
        >
          Clients
        </button>

        <button
          onClick={() => actions.router.navigateTo({ pattern: '/clients/new' })}
          className={`nav-link ${currentPattern === '/clients/new' ? 'active' : ''}`}
        >
          Add Client
        </button>
      </div>

      <div className="nav-actions">
        <button onClick={() => actions.auth.logout()} className="btn-secondary">
          Logout
        </button>
      </div>
    </nav>
  )
}
```

## Client Detail with Navigation

```tsx
// src/components/ClientDetail/index.tsx
import React, { useEffect } from 'react'

import { useActions, useAppState } from '../../overmind'

interface Props {
  clientId: number
}

export const ClientDetail: React.FC<Props> = ({ clientId }) => {
  const { clients, router } = useAppState()
  const actions = useActions()

  const client = clients.clients.find((c) => c.id === clientId)
  const isLoading = clients.current === 'FETCH_CLIENTS_IN_PROGRESS'

  useEffect(() => {
    // Load client if not in list
    if (!client && !isLoading) {
      actions.clients.loadClient(clientId)
    }
  }, [clientId, client, isLoading])

  const handleEdit = () => {
    actions.router.navigateTo({
      pattern: '/clients/:id/edit',
      routeParams: { id: clientId.toString() }
    })
  }

  const handleBack = () => {
    actions.router.navigateTo({ pattern: '/clients' })
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this client?')) {
      await actions.clients.deleteClient(clientId)
      actions.router.navigateTo({ pattern: '/clients' })
    }
  }

  if (isLoading) {
    return <div className="loading">Loading client...</div>
  }

  if (!client) {
    return (
      <div className="error">
        <h1>Client Not Found</h1>
        <button onClick={handleBack} className="btn-primary">
          Back to Clients
        </button>
      </div>
    )
  }

  return (
    <div className="client-detail">
      <div className="page-header">
        <button onClick={handleBack} className="btn-back">
          ← Back to Clients
        </button>
        <h1>{client.name}</h1>
        <div className="actions">
          <button onClick={handleEdit} className="btn-primary">
            Edit
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div className="client-info">
        <div className="info-section">
          <h2>Contact Information</h2>
          <p>
            <strong>Company:</strong> {client.company}
          </p>
          <p>
            <strong>Email:</strong> {client.email}
          </p>
          <p>
            <strong>Phone:</strong> {client.phone}
          </p>
          <p>
            <strong>Address:</strong> {client.address}
          </p>
        </div>

        <div className="info-section">
          <h2>Status</h2>
          <span
            className={`status-badge status-${client.status.toLowerCase()}`}
          >
            {client.status}
          </span>
        </div>
      </div>
    </div>
  )
}
```

## Search with Query Parameters

```tsx
// src/components/ClientList/index.tsx
import React, { useEffect, useState } from 'react'

import { useActions, useAppState } from '../../overmind'

export const ClientList: React.FC = () => {
  const { clients, router } = useAppState()
  const actions = useActions()

  // Get search from URL
  const searchQuery = router.currentRoute?.params?.search || ''
  const statusFilter = router.currentRoute?.params?.status || 'all'

  // Local state for form inputs
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [statusInput, setStatusInput] = useState(statusFilter)

  const isLoading = clients.current === 'FETCH_CLIENTS_IN_PROGRESS'
  const filteredClients = clients.clients.filter((client) => {
    const matchesSearch =
      !searchQuery ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      client.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    // Load clients if not loaded
    if (clients.clients.length === 0 && !isLoading) {
      actions.clients.loadClients()
    }
  }, [])

  useEffect(() => {
    // Sync form inputs with URL
    setSearchInput(searchQuery)
    setStatusInput(statusFilter)
  }, [searchQuery, statusFilter])

  const handleSearch = () => {
    // Update URL with search parameters
    actions.router.updateParams({
      params: {
        search: searchInput || undefined,
        status: statusInput !== 'all' ? statusInput : undefined
      }
    })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setStatusInput('all')
    actions.router.updateParams({ params: {} })
  }

  const handleClientClick = (clientId: number) => {
    actions.router.navigateTo({
      pattern: '/clients/:id',
      routeParams: { id: clientId.toString() }
    })
  }

  const handleAddClient = () => {
    actions.router.navigateTo({ pattern: '/clients/new' })
  }

  return (
    <div className="client-list">
      <div className="page-header">
        <h1>Clients</h1>
        <button onClick={handleAddClient} className="btn-primary">
          Add Client
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          <select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>

          <button onClick={handleSearch} className="btn-primary">
            Search
          </button>

          <button onClick={handleClearFilters} className="btn-secondary">
            Clear
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading clients...</div>
      ) : (
        <div className="client-grid">
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <p>No clients found</p>
              {(searchQuery || statusFilter !== 'all') && (
                <button onClick={handleClearFilters} className="btn-primary">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className="client-card"
                onClick={() => handleClientClick(client.id)}
              >
                <h3>{client.name}</h3>
                <p>{client.company}</p>
                <span
                  className={`status-badge status-${client.status.toLowerCase()}`}
                >
                  {client.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

## Authentication Guard

```typescript
// src/overmind/auth/auth.actions.ts
export const checkAuthOnNavigation = ({ state, actions }: Context) => {
  const router = state.router
  const auth = state.auth

  if (router.current === 'ROUTER_READY') {
    const { pattern } = router.currentRoute!

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/signup', '/reset-password']

    if (!publicRoutes.includes(pattern) && auth.current !== 'AUTHENTICATED') {
      // Redirect to login with return URL
      actions.router.redirectTo({
        pattern: '/login',
        params: { returnUrl: router.currentRoute!.path }
      })
    }
  }
}

// Call this in your app initialization
export const onInitializeOvermind = async ({ actions }: Context) => {
  actions.router.initializeRouter(routes)

  await actions.auth.checkSession()
  actions.auth.checkAuthOnNavigation()

  window.addEventListener('popstate', () => {
    actions.router.onPopState()
    actions.auth.checkAuthOnNavigation()
  })
}
```

## URL Building Helpers

```typescript
// src/utils/routes.ts
import { routes } from '../routes'

export const buildUrl = (
  pattern: string,
  routeParams?: Record<string, string>,
  params?: Record<string, string>
): string => {
  let url = pattern

  // Replace route parameters
  if (routeParams) {
    Object.entries(routeParams).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value)
    })
  }

  // Add query parameters
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value)
    })
    url += `?${searchParams.toString()}`
  }

  return url
}

// Usage
const clientUrl = buildUrl('/clients/:id', { id: '123' }, { tab: 'edit' })
// Result: '/clients/123?tab=edit'
```

## Performance Optimization

```tsx
// src/components/RouteRenderer/index.tsx
import React, { memo } from 'react'

import { useAppState } from '../../overmind'

// Memoized route renderer to prevent unnecessary re-renders
export const RouteRenderer = memo(() => {
  const { router } = useAppState()

  if (router.current !== 'ROUTER_READY' || !router.currentRoute) {
    return <div>Loading...</div>
  }

  const { pattern, routeParams } = router.currentRoute

  // Use React.lazy for code splitting
  switch (pattern) {
    case '/':
      return <HomePage />
    case '/clients':
      return <ClientList />
    case '/clients/:id':
      return routeParams?.id ? (
        <ClientDetail clientId={parseInt(routeParams.id)} />
      ) : (
        <div>Invalid client ID</div>
      )
    default:
      return <div>Route not found</div>
  }
})

RouteRenderer.displayName = 'RouteRenderer'
```

These examples demonstrate real-world usage patterns for the Overmind router in a React application, including navigation, authentication, search functionality, and performance optimizations.

## Where to go next

- [Overview](../README.md)
- [Setup the router](./setup.md)
- [Learn basic usage patterns](./usage.md)
- [Check the API reference](./api.md)
