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

### `navigateTo(route: ParsedRouteT)`

Navigate to a specific route.

```typescript
actions.router.navigateTo({
  pattern: '/clients/:id',
  routeParams: { id: '123' },
  params: { tab: 'edit' }
})
```

**Parameters:**

- `route.pattern` - Route pattern (e.g., `/clients/:id`)
- `route.routeParams` - Dynamic route parameters (optional)
- `route.params` - Query parameters (optional)

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

### `redirectTo(payload: { pattern: string; routeParams?: ParamsT; params?: ParamsT })`

Replace current URL without adding to history.

```typescript
actions.router.redirectTo({
  pattern: '/login',
  params: { returnUrl: '/dashboard' }
})
```

**Parameters:**

- `pattern` - Route pattern
- `routeParams` - Dynamic route parameters (optional)
- `params` - Query parameters (optional)

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

### `RoutesT`

Route definition object.

```typescript
type RoutesT = {
  [pattern: string]: {
    name: string
    [key: string]: any
  }
}

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
  path?: string
  routeParams?: ParamsT
  params?: ParamsT
}

// Example
const route: ParsedRouteT = {
  pattern: '/users/:id',
  path: '/users/123',
  routeParams: { id: '123' },
  params: { tab: 'profile' }
}
```

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

### `router.navigateTo(pattern: string, routeParams?: ParamsT, params?: ParamsT)`

Update browser URL and history.

```typescript
effects.router.navigateTo('/users/:id', { id: '123' }, { tab: 'profile' })
```

### `router.validateRoute(pattern: string, routes: RoutesT)`

Check if route pattern exists in routes definition.

```typescript
const isValid = effects.router.validateRoute('/users/:id', routes)
// Returns boolean
```

### `router.getUrlFromRoute(pattern: string, routeParams?: ParamsT, params?: ParamsT)`

Generate URL from route components.

```typescript
const url = effects.router.getUrlFromRoute(
  '/users/:id',
  { id: '123' },
  { tab: 'profile' }
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
}, [
  router.current,
  router.currentRoute?.pattern,
  router.currentRoute?.routeParams
])
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
