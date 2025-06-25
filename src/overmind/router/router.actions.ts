import type { Context } from '../index'
import type { ParamsT, ParsedRouteT, RoutesT } from './router.effects'

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
    })
  }
}

export const navigateTo = (
  { state, effects }: Context,
  route: ParsedRouteT
) => {
  const { pattern, routeParams = {}, params = {} } = route

  if (!effects.router.validateRoute(pattern, state.router.routes)) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg: `Invalid route pattern: ${pattern}`,
      errorType: 'invalid_pattern',
      currentRoute: state.router.matches('ROUTER_READY')?.currentRoute,
    })
    return
  }

  state.router.send('NAVIGATION_STARTED', { route })

  try {
    effects.router.navigateTo(pattern, routeParams, params)

    const newRoute = effects.router.getCurrentRoute(state.router.routes)
    if (newRoute) {
      state.router.send('NAVIGATION_RESOLVED', { route: newRoute })
    } else {
      state.router.send('ROUTE_NOT_FOUND_DETECTED', {
        requestedPath: effects.router.getUrlFromRoute(
          pattern,
          routeParams,
          params
        ),
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
      routeParams: {},
      params: {},
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
  const updatedParams = { ...currentRoute.params, ...payload.params }

  effects.router.replaceUrlWithParams(
    currentRoute.pattern,
    currentRoute.routeParams,
    updatedParams
  )

  const updatedRoute = { ...currentRoute, params: updatedParams }
  state.router.send('NAVIGATION_RESOLVED', { route: updatedRoute })
}

export const redirectTo = (
  { state, effects }: Context,
  payload: { pattern: string; routeParams?: ParamsT; params?: ParamsT }
) => {
  const { pattern, routeParams = {}, params = {} } = payload

  if (!effects.router.validateRoute(pattern, state.router.routes)) {
    state.router.send('NAVIGATION_REJECTED', {
      errorMsg: `Invalid route pattern: ${pattern}`,
      errorType: 'invalid_pattern',
      currentRoute: state.router.matches('ROUTER_READY')?.currentRoute,
    })
    return
  }

  effects.router.redirectTo(pattern, routeParams, params)
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
