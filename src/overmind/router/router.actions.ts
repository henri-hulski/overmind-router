import type { Context } from '../index'
import type {
  ParamsT,
  RouteConfigT,
  RouteGuardResult,
  RoutesT,
  RouteT,
  UserT,
} from './router.effects'

export const initializeRouter = (
  { state, effects }: Context,
  routes: RoutesT
) => {
  const currentRoute = effects.router.getCurrentRoute(routes)

  if (currentRoute) {
    state.router.send('ROUTER_INITIALIZED', { route: currentRoute, routes })
  } else {
    state.router.send('ROUTE_NOT_FOUND_DETECTED', {
      requestedPath: window.location.pathname,
      routes,
    })
  }
}

export const navigateTo = ({ state, effects }: Context, route: RouteT) => {
  // Parse route URL string or object input
  const { pattern, path, params, routeParams } = effects.router.parseRoute(
    route,
    state.router.routes
  )

  state.router.send('NAVIGATION_STARTED', {
    route: {
      pattern,
      path,
      params,
      routeParams,
    },
  })

  if (!effects.router.validateRoute(pattern, state.router.routes)) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg: `Invalid route pattern: ${pattern}`,
      errorType: 'invalid_pattern',
      currentRoute: state.router.matches('ROUTER_READY')?.currentRoute,
    })
    return
  }

  try {
    effects.router.navigateTo(pattern, params || {}, routeParams || {})

    const newRoute = effects.router.getCurrentRoute(state.router.routes)
    if (newRoute) {
      state.router.send('NAVIGATION_RESOLVED', { route: newRoute })
    } else {
      state.router.send('ROUTE_NOT_FOUND_DETECTED', {
        requestedPath: path,
      })
    }
  } catch (error) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg: error instanceof Error ? error.message : 'Navigation failed',
      errorType: 'navigation_error',
      currentRoute: state.router.matches('ROUTER_READY')?.currentRoute,
    })
  }
}

export const navigateBack = ({ state, effects }: Context) => {
  const currentRoute = state.router.matches('ROUTER_READY')?.currentRoute

  state.router.send('NAVIGATION_STARTED', {
    route: {
      pattern: 'browser_back',
      path: '',
    },
  })

  try {
    effects.router.navigateBack()

    const newRoute = effects.router.getCurrentRoute(state.router.routes)
    if (newRoute) {
      state.router.send('BROWSER_NAVIGATION_DETECTED', { route: newRoute })
    } else {
      state.router.send('ROUTE_NOT_FOUND_DETECTED', {
        requestedPath: window.location.pathname,
      })
    }
  } catch (error) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg:
        error instanceof Error ? error.message : 'Back navigation failed',
      errorType: 'browser_navigation_error',
      currentRoute,
    })
  }
}

export const navigateForward = ({ state, effects }: Context) => {
  const currentRoute = state.router.matches('ROUTER_READY')?.currentRoute

  state.router.send('NAVIGATION_STARTED', {
    route: {
      pattern: 'browser_forward',
      path: '',
    },
  })

  try {
    effects.router.navigateForward()

    const newRoute = effects.router.getCurrentRoute(state.router.routes)
    if (newRoute) {
      state.router.send('BROWSER_NAVIGATION_DETECTED', { route: newRoute })
    } else {
      state.router.send('ROUTE_NOT_FOUND_DETECTED', {
        requestedPath: window.location.pathname,
      })
    }
  } catch (error) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg:
        error instanceof Error ? error.message : 'Forward navigation failed',
      errorType: 'browser_navigation_error',
      currentRoute,
    })
  }
}

export const updateParams = (
  { state, effects }: Context,
  payload: { params: ParamsT }
) => {
  const readyState = state.router.matches('ROUTER_READY')
  if (!readyState?.currentRoute) {
    return
  }

  const currentRoute = readyState.currentRoute
  const routeConfig = state.router.routes[currentRoute.pattern]
  const expectedParams = routeConfig?.params || []

  // Merge params, then filter to only include expected params
  const mergedParams = { ...currentRoute.params, ...payload.params }
  const filteredParams: ParamsT = {}

  for (const paramName of expectedParams) {
    if (paramName in mergedParams) {
      filteredParams[paramName] = mergedParams[paramName]
    }
  }

  effects.router.replaceUrlWithParams(
    currentRoute.pattern,
    filteredParams,
    currentRoute.routeParams
  )

  // Get the actual current route after URL update
  const updatedRoute = effects.router.getCurrentRoute(state.router.routes)
  if (updatedRoute) {
    state.router.send('NAVIGATION_RESOLVED', { route: updatedRoute })
  }
}

export const redirectTo = ({ state, effects }: Context, route: RouteT) => {
  // Parse route URL string or object input
  const { pattern, path, params, routeParams } = effects.router.parseRoute(
    route,
    state.router.routes
  )

  state.router.send('NAVIGATION_STARTED', {
    route: {
      pattern,
      path,
      params,
      routeParams,
    },
  })

  if (!effects.router.validateRoute(pattern, state.router.routes)) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg: `Invalid route pattern: ${pattern}`,
      errorType: 'invalid_pattern',
      currentRoute: state.router.matches('ROUTER_READY')?.currentRoute,
    })
    return
  }

  try {
    effects.router.redirectTo(pattern, params || {}, routeParams || {})

    // Note: This will likely not execute since redirectTo causes a full page redirect
    // but included for state machine consistency
    const newRoute = effects.router.getCurrentRoute(state.router.routes)
    if (newRoute) {
      state.router.send('NAVIGATION_RESOLVED', { route: newRoute })
    }
  } catch (error) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg: error instanceof Error ? error.message : 'Redirect failed',
      errorType: 'redirect_error',
      currentRoute: state.router.matches('ROUTER_READY')?.currentRoute,
    })
  }
}

export const onPopState = ({ state, effects }: Context) => {
  const currentRoute = effects.router.getCurrentRoute(state.router.routes)

  if (currentRoute) {
    state.router.send('BROWSER_NAVIGATION_DETECTED', { route: currentRoute })
  } else {
    state.router.send('ROUTE_NOT_FOUND_DETECTED', {
      requestedPath: window.location.pathname,
    })
  }
}

export const checkRouteAccess = (
  _: Context,
  payload: { routeConfig: RouteConfigT; user: UserT | null }
): RouteGuardResult => {
  const { routeConfig, user } = payload

  // Check authentication
  if (routeConfig.requiresAuth && !user) {
    return {
      allowed: false,
      reason: 'authentication',
      message: 'Authentication required',
    }
  }

  // Check custom guard
  if (routeConfig.guard) {
    try {
      if (!routeConfig.guard(user)) {
        return {
          allowed: false,
          reason: 'authorization',
          message: 'Insufficient permissions',
        }
      }
    } catch {
      return {
        allowed: false,
        reason: 'authorization',
        message: 'Guard function error',
      }
    }
  }

  return { allowed: true }
}
