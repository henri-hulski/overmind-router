# API Reference

Complete reference for the Overmind router API.

## Actions

### `initializeRouter(routes: RoutesT)`

Initialize the router with route definitions and parse the current URL.

```typescript
actions.router.initializeRouter({
  '/': { name: 'home' },
  '/clients': { name: 'clientList' },
  '/clients/:id': { name: 'clientDetail' }
})
```

**Parameters:**

- `routes` - Object mapping route patterns to route metadata

**Events:** `ROUTER_INITIALIZED` | `ROUTE_NOT_FOUND_DETECTED`

---

### `navigateTo(route: RouteToT)`

Navigate to a specific route.

```typescript
// Simple navigation
// string format
actions.router.navigateTo('/clients')
//object format
action.router.navigateTo({
  pattern: '/clients'
})

// URL with query parameters
// string format
actions.router.navigateTo('/login?returnUrl=home')
// object format
actions.router.navigateTo({
  pattern: '/login',
  params: { returnUrl: 'home' }
})

// Navigation with route parameters
// string format
actions.router.navigateTo('/clients/123')
// object format
actions.router.navigateTo({
  pattern: '/clients/:id',
  routeParams: { id: '123' }
})

// Navigation with route and query parameters
// string format
actions.router.navigateTo('/clients/123?tab=edit')
// object format
actions.router.navigateTo({
  pattern: '/clients/:id',
  params: { tab: 'edit' },
  routeParams: { id: '123' }
})
```

**Parameters:**

- `route` - Either a string (pattern or URL with query params) or an object containing:
  - `pattern` - Route pattern (e.g., `/clients/:id`)
  - `params` - Query parameters (optional)
  - `routeParams` - Dynamic route parameters (optional)

**Events:** `NAVIGATION_STARTED` → `NAVIGATION_RESOLVED` | `NAVIGATION_REJECTED` | `ROUTE_NOT_FOUND_DETECTED`

---

### `navigateBack()`

Navigate back in browser history.

```typescript
actions.router.navigateBack()
```

**Events:** `NAVIGATION_STARTED` → `BROWSER_NAVIGATION_DETECTED` | `ROUTE_NOT_FOUND_DETECTED` | `NAVIGATION_REJECTED`

---

### `navigateForward()`

Navigate forward in browser history.

```typescript
actions.router.navigateForward()
```

**Events:** `NAVIGATION_STARTED` → `BROWSER_NAVIGATION_DETECTED` | `ROUTE_NOT_FOUND_DETECTED` | `NAVIGATION_REJECTED`

---

### `updateParams(payload: { params: ParamsT })`

Update query parameters without navigation.

```typescript
actions.router.updateParams({
  params: { search: 'john', filter: 'active' }
})
```

**Parameters:**

- `params` - Query parameters to merge with current params

**Events:** `NAVIGATION_RESOLVED`

---

### `redirectTo(route: RouteToT)`

Replace current URL without adding to history.

```typescript
// Simple redirect
actions.router.redirectTo('/login')

// Redirect with query parameters
actions.router.redirectTo('/login?returnUrl=home')

// Redirect with object format
actions.router.redirectTo({
  pattern: '/login',
  params: { returnUrl: '/dashboard' }
})
```

**Parameters:**

- `route` - Either a string (pattern or URL with query params) or an object containing:
  - `pattern` - Route pattern
  - `params` - Query parameters (optional)
  - `routeParams` - Dynamic route parameters (optional)

---

### `onPopState()`

Handle browser popstate events (back/forward buttons).

```typescript
// Usually called automatically
window.addEventListener('popstate', () => {
  actions.router.onPopState()
})
```

**Events:** `BROWSER_NAVIGATION_DETECTED` | `ROUTE_NOT_FOUND_DETECTED`

## State

### Router State Machine

The router state follows these patterns:

```typescript
type RouterState =
  | { current: 'ROUTER_INITIAL' }
  | { current: 'NAVIGATION_IN_PROGRESS'; route: ParsedRouteT }
  | { current: 'ROUTER_READY'; currentRoute: ParsedRouteT; routes: RoutesT }
  | { current: 'ROUTE_NOT_FOUND'; requestedPath: string }
  | {
      current: 'NAVIGATION_FAILURE'
      errorMsg: string
      errorType: string
      currentRoute?: ParsedRouteT
    }
```

### State Access

```typescript
const { router } = useAppState()

// Check current state
switch (router.current) {
  case 'ROUTER_READY':
    // Access router.currentRoute and router.routes
    break
  case 'ROUTE_NOT_FOUND':
    // Access router.requestedPath
    break
  case 'NAVIGATION_FAILURE':
    // Access router.errorMsg, router.errorType, router.currentRoute
    break
}
```

## Types

### `RouteConfigT` and `RoutesT`

Route definition object.

```typescript
type RouteConfigT = {
  params?: string[]
}

type RoutesT = Record<string, RouteConfigT>

// Example
const routes: RoutesT = {
  '/': { name: 'home' },
  '/users/:id': { name: 'userDetail', auth: true },
  '/admin': { name: 'admin', role: 'admin' }
}
```

### `ParsedRouteT`

Parsed route object.

```typescript
type ParsedRouteT = {
  pattern: string
  path: string
  params?: ParamsT
  routeParams?: ParamsT
}

// Example
const route: ParsedRouteT = {
  pattern: '/users/:id',
  path: '/users/123',
  params: { tab: 'profile' },
  routeParams: { id: '123' }
}
```

### `RouteToT`

Route navigation payload type.

```typescript
type RouteToT =
  | string // Simple pattern or full URL with query params
  | {
      pattern: string
      params?: ParamsT
      routeParams?: ParamsT
    }

// Examples
const simpleRoute: RouteToT = '/home'
const urlWithQuery: RouteToT = '/login?returnUrl=home'
const complexRoute: RouteToT = {
  pattern: '/users/:id',
  params: { tab: 'profile' },
  routeParams: { id: '123' }
}
```

**String Format Options:**

- **Simple pattern**: `'/home'`, `'/clients'`
- **URL with query params**: `'/login?returnUrl=home'`, `'/users/123?tab=profile'`
- **For dynamic routes**: Use object format for route parameters like `/users/:id`

### `ParamsT`

Parameters object (route params or query params).

```typescript
type ParamsT = {
  [key: string]: string
}

// Examples
const routeParams: ParamsT = { id: '123', category: 'electronics' }
const queryParams: ParamsT = { search: 'phone', sort: 'price' }
```

## Events

### Router Events

- `ROUTER_INITIALIZED` - Router successfully initialized
- `NAVIGATION_STARTED` - Navigation begun
- `NAVIGATION_RESOLVED` - Navigation completed successfully
- `NAVIGATION_REJECTED` - Navigation failed
- `ROUTE_NOT_FOUND_DETECTED` - Route pattern not found
- `BROWSER_NAVIGATION_DETECTED` - Browser back/forward navigation

### Event Payloads

```typescript
// ROUTER_INITIALIZED
{ route: ParsedRouteT; routes: RoutesT }

// NAVIGATION_STARTED
{ route: ParsedRouteT }

// NAVIGATION_RESOLVED
{ route: ParsedRouteT }

// NAVIGATION_REJECTED
{ errorMsg: string; errorType: string; currentRoute?: ParsedRouteT }

// ROUTE_NOT_FOUND_DETECTED
{ requestedPath: string }

// BROWSER_NAVIGATION_DETECTED
{ route: ParsedRouteT }
```

## Effects

### `router.getCurrentRoute(routes: RoutesT)`

Parse current browser URL into route object.

```typescript
const currentRoute = effects.router.getCurrentRoute(routes)
// Returns ParsedRouteT | null
```

### `router.navigateTo(pattern: string, params?: ParamsT, routeParams?: ParamsT)`

Update browser URL and history.

```typescript
effects.router.navigateTo('/users/:id', { tab: 'profile' }, { id: '123' })
```

### `router.validateRoute(pattern: string, routes: RoutesT)`

Check if route pattern exists in routes definition.

```typescript
const isValid = effects.router.validateRoute('/users/:id', routes)
// Returns boolean
```

### `router.parseRoute(route: RouteToT, routes: RoutesT)`

Parse a RouteToT input (string or object) into its constituent parts.

```typescript
// Parse URL string
const parsed = effects.router.parseRoute('/users/123?tab=profile', routes)
// Returns { pattern: '/users/:id', params: { tab: 'profile' }, routeParams: { id: '123' } }

// Parse object input
const parsed = effects.router.parseRoute(
  {
    pattern: '/users/:id',
    params: { tab: 'profile' },
    routeParams: { id: '123' }
  },
  routes
)
// Returns the same object
```

### `router.getUrlFromRoute(pattern: string, params?: ParamsT, routeParams?: ParamsT)`

Generate URL from route components.

```typescript
const url = effects.router.getUrlFromRoute(
  '/users/:id',
  { tab: 'profile' },
  { id: '123' }
)
// Returns '/users/123?tab=profile'
```

## Error Handling

### Navigation Errors

```typescript
// Check for navigation errors
if (router.current === 'NAVIGATION_FAILURE') {
  console.log('Error:', router.errorMsg)
  console.log('Type:', router.errorType)

  // Possible error types:
  // - 'invalid_pattern' - Route pattern not found
  // - 'navigation_error' - Browser navigation failed
  // - 'browser_navigation_error' - Back/forward navigation failed
}
```

### Route Not Found

```typescript
// Handle 404 errors
if (router.current === 'ROUTE_NOT_FOUND') {
  console.log('Path not found:', router.requestedPath)
}
```

## Reactive Patterns

### Listen to Route Changes

```typescript
// In a component
useEffect(() => {
  if (router.current === 'ROUTER_READY') {
    const { pattern, routeParams } = router.currentRoute

    // React to route changes
    if (pattern === '/users/:id' && routeParams?.id) {
      loadUserData(routeParams.id)
    }
  }
}, [router])
```

### Conditional Rendering

```typescript
// Route-based component rendering
const renderRoute = () => {
  if (router.current !== 'ROUTER_READY') return <Loading />

  const { pattern, routeParams } = router.currentRoute

  switch (pattern) {
    case '/':
      return <HomePage />
    case '/users/:id':
      return <UserDetail userId={routeParams?.id} />
    default:
      return <NotFound />
  }
}
```

## Where to go next

- [Overview](../README.md)
- [Setup the router](./setup.md)
- [Learn basic usage patterns](./usage.md)
- [See complete examples](./examples.md)
