# Usage Guide

Learn how to use the Overmind router for navigation and route handling.

## Navigation

### Basic Navigation

Navigate to a simple route:

```typescript
// Navigate to home page
actions.router.navigateTo({ pattern: '/' })

// Navigate to clients list
actions.router.navigateTo({ pattern: '/clients' })
```

### Navigation with Route Parameters

Navigate to routes with dynamic segments:

```typescript
// Navigate to specific client
actions.router.navigateTo({
  pattern: '/clients/:id',
  routeParams: { id: '123' }
})

// Navigate to edit client
actions.router.navigateTo({
  pattern: '/clients/:id/edit',
  routeParams: { id: '123' }
})
```

### Navigation with Query Parameters

Add query parameters to any route:

```typescript
// Navigate with search query
actions.router.navigateTo({
  pattern: '/clients',
  params: { search: 'john', status: 'active' }
})
// Results in: /clients?search=john&status=active
```

### Browser Navigation

Handle browser back/forward buttons:

```typescript
// Go back
actions.router.navigateBack()

// Go forward
actions.router.navigateForward()
```

## Reading Route Data

### Access Current Route

```typescript
const { router } = useAppState()

if (router.current === 'ROUTER_READY' && router.currentRoute) {
  const { pattern, routeParams, params, path } = router.currentRoute

  // pattern: '/clients/:id'
  // path: '/clients/123'
  // params: { search: 'john' }
  // routeParams: { id: '123' }
}
```

### Route Parameters in Components

```tsx
interface ClientDetailProps {
  clientId: number
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ clientId }) => {
  const { clients } = useAppState()
  const client = clients.clients.find((c) => c.id === clientId)

  return (
    <div>
      <h1>Client: {client?.name}</h1>
    </div>
  )
}

// In your App component:
{
  pattern === '/clients/:id' && routeParams?.id && (
    <ClientDetail clientId={parseInt(routeParams.id)} />
  )
}
```

### Query Parameters

```typescript
const { router } = useAppState()

if (router.currentRoute) {
  const searchQuery = router.currentRoute.params?.search
  const statusFilter = router.currentRoute.params?.status
}
```

## State Machine States

### Router States

Monitor router state for loading indicators:

```tsx
const { router } = useAppState()

// Show loading spinner during navigation
if (router.current === 'NAVIGATION_IN_PROGRESS') {
  return <div>Navigating...</div>
}

// Handle route not found
if (router.current === 'ROUTE_NOT_FOUND') {
  return (
    <div>
      <h1>Page Not Found</h1>
      <p>The path "{router.requestedPath}" was not found.</p>
      <button onClick={() => actions.router.navigateTo({ pattern: '/' })}>
        Go Home
      </button>
    </div>
  )
}

// Handle navigation errors
if (router.current === 'NAVIGATION_FAILURE') {
  return (
    <div>
      <h1>Navigation Error</h1>
      <p>{router.errorMsg}</p>
    </div>
  )
}
```

## URL Updates

### Update Query Parameters

Update query parameters without navigation:

```typescript
// Add or update search parameter
actions.router.updateParams({ params: { search: 'new search' } })
```

### Replace URL

Replace current URL without adding to history:

```typescript
actions.router.redirectTo({
  pattern: '/login',
  params: { returnUrl: window.location.pathname }
})
```

## Navigation Guards

### Conditional Navigation

Check conditions before navigation:

```typescript
// In your component
const handleNavigateToEdit = () => {
  if (user.hasPermission('edit_client')) {
    actions.router.navigateTo({
      pattern: '/clients/:id/edit',
      routeParams: { id: client.id.toString() }
    })
  } else {
    alert('Permission denied')
  }
}
```

### Authentication Check

```typescript
// In your app initialization
export const onInitializeOvermind = async ({ state, actions }: Context) => {
  const isAuthenticated = await actions.auth.checkSession()

  if (!isAuthenticated) {
    actions.router.redirectTo({
      pattern: '/login',
      params: { returnUrl: window.location.pathname }
    })
  } else {
    actions.router.initializeRouter(routes)
  }
}
```

## Route Access Control

### Checking Route Access

Use the `checkRouteAccess` action to verify if a user can access a specific route:

```typescript
// Check if current user can access admin routes
const adminRoute = routes['/admin']
const accessResult = actions.router.checkRouteAccess({
  routeConfig: adminRoute,
  user: state.auth.currentUser
})

if (accessResult.allowed) {
  // User can access the route
  actions.router.navigateTo('/admin')
} else {
  // Handle access denied
  console.log(`Access denied: ${accessResult.message}`)
  if (accessResult.reason === 'authentication') {
    actions.router.navigateTo('/login')
  } else {
    // Show unauthorized message
  }
}
```

### Authentication Guards

Routes with `requiresAuth: true` automatically check if a user is present:

```typescript
const protectedRoutes = {
  '/dashboard': {
    params: [],
    requiresAuth: true // Requires user to be authenticated
  }
}

// Check access
const result = actions.router.checkRouteAccess({
  routeConfig: protectedRoutes['/dashboard'],
  user: null // No user = access denied
})
// result = { allowed: false, reason: 'authentication', message: 'Authentication required' }
```

### Authorization Guards

Use custom guard functions for role-based access:

```typescript
const hasAdminRole = (user: UserT | null) => !!(user && user.isAdmin)

const adminRoutes = {
  '/admin': {
    params: [],
    requiresAuth: true,
    guard: hasAdminRole // Check if user is admin
  }
}
```

### Integration with Components

Check route access in your components:

```typescript
function Navigation() {
  const { auth, router } = useAppState()
  const actions = useActions()

  const canAccessAdmin = () => {
    const result = actions.router.checkRouteAccess({
      routeConfig: routes['/admin'],
      user: auth.currentUser
    })
    return result.allowed
  }

  return (
    <nav>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/clients">Clients</NavLink>
      {auth.currentUser && (
        <NavLink to="/dashboard">Dashboard</NavLink>
      )}
      {canAccessAdmin() && (
        <NavLink to="/admin">Admin</NavLink>
      )}
    </nav>
  )
}
```

## Best Practices

1. **Always check router state** before accessing `currentRoute`
2. **Use route parameters for IDs** and query parameters for filters
3. **Handle loading states** during navigation
4. **Provide error fallbacks** for route not found
5. **Initialize router early** in app startup
6. **Use TypeScript** for type safety

## Where to go next

- [Overview](../README.md)
- [Setup the router](./setup.md)
- [Check the API reference](./api.md)
- [See complete examples](./examples.md)
