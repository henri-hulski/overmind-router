import { statemachine } from 'overmind'

import type { ParsedRouteT, RoutesT } from './router.effects'

type BaseState = {
  routes: RoutesT
}

type States =
  | {
      current: 'ROUTER_INITIAL'
    }
  | {
      current: 'ROUTER_READY'
      currentRoute: ParsedRouteT
    }
  | {
      current: 'NAVIGATION_IN_PROGRESS'
      currentRoute?: ParsedRouteT
    }
  | {
      current: 'NAVIGATION_FAILURE'
      currentRoute?: ParsedRouteT
      errorMsg?: string
      errorType?: string
    }
  | {
      current: 'ROUTE_NOT_FOUND'
      currentRoute?: ParsedRouteT
      requestedPath?: string
    }

type Events =
  | {
      type: 'ROUTER_INITIALIZED'
      data: {
        route: ParsedRouteT
        routes: RoutesT
      }
    }
  | {
      type: 'NAVIGATION_STARTED'
      data: {
        route: ParsedRouteT
      }
    }
  | {
      type: 'NAVIGATION_RESOLVED'
      data: {
        route: ParsedRouteT
      }
    }
  | {
      type: 'NAVIGATION_REJECTED'
      data: {
        errorMsg: string
        errorType: string
        currentRoute?: ParsedRouteT
      }
    }
  | {
      type: 'ROUTE_NOT_FOUND_DETECTED'
      data: {
        requestedPath: string
      }
    }
  | {
      type: 'BROWSER_NAVIGATION_DETECTED'
      data: {
        route: ParsedRouteT
      }
    }

const routerMachine = statemachine<States, Events, BaseState>({
  ROUTER_INITIAL: {
    ROUTER_INITIALIZED: ({ route, routes }, state) => {
      state.routes = routes
      return {
        current: 'ROUTER_READY',
        currentRoute: route,
      }
    },
    ROUTE_NOT_FOUND_DETECTED: ({ requestedPath }) => ({
      current: 'ROUTE_NOT_FOUND',
      requestedPath,
    }),
  },

  ROUTER_READY: {
    NAVIGATION_STARTED: ({ route }) => ({
      current: 'NAVIGATION_IN_PROGRESS',
      currentRoute: route,
    }),
    NAVIGATION_REJECTED: ({ errorMsg, errorType }, state) => ({
      current: 'NAVIGATION_FAILURE',
      currentRoute: { ...state.currentRoute },
      errorMsg,
      errorType,
    }),
    BROWSER_NAVIGATION_DETECTED: ({ route }) => ({
      current: 'ROUTER_READY',
      currentRoute: route,
    }),
    ROUTE_NOT_FOUND_DETECTED: ({ requestedPath }, state) => ({
      current: 'ROUTE_NOT_FOUND',
      currentRoute: state.currentRoute ? { ...state.currentRoute } : undefined,
      requestedPath,
    }),
  },

  NAVIGATION_IN_PROGRESS: {
    NAVIGATION_RESOLVED: ({ route }) => ({
      current: 'ROUTER_READY',
      currentRoute: route,
    }),
    NAVIGATION_REJECTED: ({ errorMsg, errorType, currentRoute }, state) => ({
      current: 'NAVIGATION_FAILURE',
      currentRoute: currentRoute
        ? { ...currentRoute }
        : state.currentRoute
          ? { ...state.currentRoute }
          : undefined,
      errorMsg,
      errorType,
    }),
    ROUTE_NOT_FOUND_DETECTED: ({ requestedPath }, state) => ({
      current: 'ROUTE_NOT_FOUND',
      currentRoute: state.currentRoute ? { ...state.currentRoute } : undefined,
      requestedPath,
    }),
  },

  NAVIGATION_FAILURE: {
    NAVIGATION_STARTED: ({ route }) => ({
      current: 'NAVIGATION_IN_PROGRESS',
      currentRoute: route,
    }),
    ROUTER_INITIALIZED: ({ route, routes }, state) => {
      state.routes = routes
      return {
        current: 'ROUTER_READY',
        currentRoute: route,
      }
    },
    BROWSER_NAVIGATION_DETECTED: ({ route }) => ({
      current: 'ROUTER_READY',
      currentRoute: route,
    }),
  },

  ROUTE_NOT_FOUND: {
    NAVIGATION_STARTED: ({ route }) => ({
      current: 'NAVIGATION_IN_PROGRESS',
      currentRoute: route,
    }),
    ROUTER_INITIALIZED: ({ route, routes }, state) => {
      state.routes = routes
      return {
        current: 'ROUTER_READY',
        currentRoute: route,
      }
    },
    BROWSER_NAVIGATION_DETECTED: ({ route }) => ({
      current: 'ROUTER_READY',
      currentRoute: route,
    }),
  },
})

export const state = routerMachine.create(
  {
    current: 'ROUTER_INITIAL',
  },
  { routes: {} }
)
