import type { Context } from './index'
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
  const currentRoute = effects.getCurrentRoute(routes)

  if (currentRoute) {
    state.send('ROUTER_INITIALIZED', { route: currentRoute, routes })
  } else {
    state.send('ROUTE_NOT_FOUND_DETECTED', {
      requestedPath: window.location.pathname,
      routes,
    })
  }
}

export const getCurrentRoute = ({ state }: Context) => {
  return state.current === 'ROUTER_READY' && state.currentRoute
    ? state.currentRoute
    : null
}

export const navigateTo = ({ state, effects }: Context, route: RouteT) => {
  // Parse route URL string or object input
  const { pattern, path, params, routeParams } = effects.parseRoute(
    route,
    state.routes
  )
  state.send('NAVIGATION_STARTED', {
    route: {
      pattern,
      path,
      params,
      routeParams,
    },
  })

  if (!effects.validateRoute(pattern, state.routes)) {
    state.send('NAVIGATION_REJECTED', {
      errorMsg: `Invalid route pattern: ${pattern}`,
      errorType: 'invalid_pattern',
      currentRoute: state.matches('ROUTER_READY')?.currentRoute,
    })
    return
  }

  try {
    effects.navigateTo(pattern, params || {}, routeParams || {})

    const newRoute = effects.getCurrentRoute(state.routes)
    if (newRoute) {
      state.send('NAVIGATION_RESOLVED', { route: newRoute })
    } else {
      state.send('ROUTE_NOT_FOUND_DETECTED', {
        requestedPath: path,
      })
    }
  } catch (error) {
    state.send('NAVIGATION_REJECTED', {
      errorMsg: error instanceof Error ? error.message : 'Navigation failed',
      errorType: 'navigation_error',
      currentRoute: state.matches('ROUTER_READY')?.currentRoute,
    })
  }
}

export const navigateBack = ({ state, effects }: Context) => {
  const currentRoute = state.matches('ROUTER_READY')?.currentRoute

  state.send('NAVIGATION_STARTED', {
    route: {
      pattern: 'browser_back',
      path: '',
    },
  })

  try {
    effects.navigateBack()

    const newRoute = effects.getCurrentRoute(state.routes)
    if (newRoute) {
      state.send('BROWSER_NAVIGATION_DETECTED', { route: newRoute })
    } else {
      state.send('ROUTE_NOT_FOUND_DETECTED', {
        requestedPath: window.location.pathname,
      })
    }
  } catch (error) {
    state.send('NAVIGATION_REJECTED', {
      errorMsg:
        error instanceof Error ? error.message : 'Back navigation failed',
      errorType: 'browser_navigation_error',
      currentRoute,
    })
  }
}

export const navigateForward = ({ state, effects }: Context) => {
  const currentRoute = state.matches('ROUTER_READY')?.currentRoute

  state.send('NAVIGATION_STARTED', {
    route: {
      pattern: 'browser_forward',
      path: '',
    },
  })

  try {
    effects.navigateForward()

    const newRoute = effects.getCurrentRoute(state.routes)
    if (newRoute) {
      state.send('BROWSER_NAVIGATION_DETECTED', { route: newRoute })
    } else {
      state.send('ROUTE_NOT_FOUND_DETECTED', {
        requestedPath: window.location.pathname,
      })
    }
  } catch (error) {
    state.send('NAVIGATION_REJECTED', {
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
  const readyState = state.matches('ROUTER_READY')
  if (!readyState?.currentRoute) {
    return
  }

  const currentRoute = readyState.currentRoute
  const routeConfig = state.routes[currentRoute.pattern]
  const expectedParams = routeConfig?.params || []

  // Merge params, then filter to only include expected params
  const mergedParams = { ...currentRoute.params, ...payload.params }
  const filteredParams: ParamsT = {}

  for (const paramName of expectedParams) {
    if (paramName in mergedParams) {
      filteredParams[paramName] = mergedParams[paramName]
    }
  }

  effects.replaceUrlWithParams(
    currentRoute.pattern,
    filteredParams,
    currentRoute.routeParams
  )

  // Get the actual current route after URL update
  const updatedRoute = effects.getCurrentRoute(state.routes)
  if (updatedRoute) {
    state.send('NAVIGATION_RESOLVED', { route: updatedRoute })
  }
}

export const redirectTo = ({ state, effects }: Context, route: RouteT) => {
  // Parse route URL string or object input
  const { pattern, path, params, routeParams } = effects.parseRoute(
    route,
    state.routes
  )

  state.send('NAVIGATION_STARTED', {
    route: {
      pattern,
      path,
      params,
      routeParams,
    },
  })

  if (!effects.validateRoute(pattern, state.routes)) {
    state.send('NAVIGATION_REJECTED', {
      errorMsg: `Invalid route pattern: ${pattern}`,
      errorType: 'invalid_pattern',
      currentRoute: state.matches('ROUTER_READY')?.currentRoute,
    })
    return
  }

  try {
    effects.redirectTo(pattern, params || {}, routeParams || {})

    // Note: This will likely not execute since redirectTo causes a full page redirect
    // but included for state machine consistency
    const newRoute = effects.getCurrentRoute(state.routes)
    if (newRoute) {
      state.send('NAVIGATION_RESOLVED', { route: newRoute })
    }
  } catch (error) {
    state.send('NAVIGATION_REJECTED', {
      errorMsg: error instanceof Error ? error.message : 'Redirect failed',
      errorType: 'redirect_error',
      currentRoute: state.matches('ROUTER_READY')?.currentRoute,
    })
  }
}

export const onPopState = ({ state, effects }: Context) => {
  const currentRoute = effects.getCurrentRoute(state.routes)

  if (currentRoute) {
    state.send('BROWSER_NAVIGATION_DETECTED', { route: currentRoute })
  } else {
    state.send('ROUTE_NOT_FOUND_DETECTED', {
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
