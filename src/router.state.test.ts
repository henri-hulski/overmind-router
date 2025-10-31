import { createOvermindMock, type IContext } from 'overmind'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ParsedRouteT, RoutesT } from './router.effects'
import { state as routerState } from './router.state'
import { routes } from './testRoutes'

// Create a test config using the actual router state
const createTestConfig = () => {
  const initializeRouter = (
    { state }: Context,
    data: {
      route: ParsedRouteT
      routes: RoutesT
    }
  ) => {
    state.send('ROUTER_INITIALIZED', data)
  }

  const navigateTo = ({ state }: Context, data: { route: ParsedRouteT }) => {
    state.send('NAVIGATION_STARTED', data)
  }

  const completeNavigation = (
    { state }: Context,
    data: { route: ParsedRouteT }
  ) => {
    state.send('NAVIGATION_RESOLVED', data)
  }

  const setRouterError = (
    { state }: Context,
    data: { errorMsg: string; errorType: string; currentRoute?: ParsedRouteT }
  ) => {
    state.send('NAVIGATION_REJECTED', data)
  }

  const resetRouter = (
    { state }: Context,
    data: { route: ParsedRouteT; routes: RoutesT }
  ) => {
    state.send('ROUTER_INITIALIZED', data)
  }

  const detectRouteNotFound = (
    { state }: Context,
    data: { requestedPath: string }
  ) => {
    state.send('ROUTE_NOT_FOUND_DETECTED', data)
  }

  const actions = {
    initializeRouter,
    navigateTo,
    completeNavigation,
    setRouterError,
    resetRouter,
    detectRouteNotFound,
  }

  type Context = IContext<{
    state: typeof routerState
    actions: typeof actions
  }>

  return {
    state: routerState,
    actions,
  }
}

describe('Router State Machine', () => {
  let overmind: ReturnType<
    typeof createOvermindMock<ReturnType<typeof createTestConfig>>
  >

  beforeEach(() => {
    overmind = createOvermindMock(createTestConfig())
  })

  test('should start in ROUTER_INITIAL state', () => {
    expect(overmind.state.current).toBe('ROUTER_INITIAL')
    expect(overmind.state.matches('ROUTER_INITIAL')).toBeTruthy()
  })

  describe('ROUTER_INITIAL', () => {
    test('should transition to ROUTER_READY on ROUTER_INITIALIZED', () => {
      const mockRoute = {
        pattern: '/',
        path: '/',
        routeParams: {},
        params: {},
      }

      overmind.actions.initializeRouter({ route: mockRoute, routes: routes })

      expect(overmind.state.matches('ROUTER_READY')).toBeTruthy()
      if (overmind.state.current === 'ROUTER_READY') {
        expect(overmind.state.currentRoute).toEqual(mockRoute)
      }
    })

    test('should transition to ROUTE_NOT_FOUND on ROUTE_NOT_FOUND_DETECTED', () => {
      const requestedPath = '/invalid/path'

      overmind.actions.detectRouteNotFound({ requestedPath })

      expect(overmind.state.matches('ROUTE_NOT_FOUND')).toBeTruthy()
      if (overmind.state.current === 'ROUTE_NOT_FOUND') {
        expect(overmind.state.requestedPath).toBe(requestedPath)
      }
    })
  })

  describe('ROUTER_READY', () => {
    beforeEach(() => {
      const mockRoute = {
        pattern: '/',
        path: '/',
        routeParams: {},
        params: {},
      }
      overmind.actions.initializeRouter({ route: mockRoute, routes: routes })
    })

    test('should transition to NAVIGATION_IN_PROGRESS on NAVIGATION_STARTED', () => {
      const mockRoute = {
        pattern: '/test',
        path: '/test',
        routeParams: {},
        params: {},
      }

      overmind.actions.navigateTo({ route: mockRoute })

      expect(overmind.state.matches('NAVIGATION_IN_PROGRESS')).toBeTruthy()
      if (overmind.state.current === 'NAVIGATION_IN_PROGRESS') {
        expect(overmind.state.currentRoute).toEqual(mockRoute)
      }
    })

    test('should transition to NAVIGATION_FAILURE on NAVIGATION_REJECTED', () => {
      const mockError = {
        errorMsg: 'Navigation error',
        errorType: 'GENERAL_ERROR',
      }

      overmind.actions.setRouterError(mockError)

      expect(overmind.state.matches('NAVIGATION_FAILURE')).toBeTruthy()
      if (overmind.state.current === 'NAVIGATION_FAILURE') {
        expect(overmind.state.errorMsg).toBe(mockError.errorMsg)
      }
    })
  })

  describe('NAVIGATION_IN_PROGRESS', () => {
    beforeEach(() => {
      const mockRoute = {
        pattern: '/',
        path: '/',
        routeParams: {},
        params: {},
      }
      overmind.actions.initializeRouter({ route: mockRoute, routes: routes })

      const newRoute = {
        pattern: '/test',
        path: '/test',
        routeParams: {},
        params: {},
      }
      overmind.actions.navigateTo({ route: newRoute })
    })

    test('should transition to ROUTER_READY on NAVIGATION_RESOLVED', () => {
      const resolvedRoute = {
        pattern: '/test',
        path: '/test',
        routeParams: {},
        params: {},
      }
      overmind.actions.completeNavigation({ route: resolvedRoute })

      expect(overmind.state.matches('ROUTER_READY')).toBeTruthy()
    })

    test('should transition to NAVIGATION_FAILURE on NAVIGATION_REJECTED', () => {
      const mockError = {
        errorMsg: 'Navigation failed',
        errorType: 'GENERAL_ERROR',
      }

      overmind.actions.setRouterError(mockError)

      expect(overmind.state.matches('NAVIGATION_FAILURE')).toBeTruthy()
      if (overmind.state.current === 'NAVIGATION_FAILURE') {
        expect(overmind.state.errorMsg).toBe(mockError.errorMsg)
      }
    })
  })

  describe('NAVIGATION_FAILURE', () => {
    beforeEach(() => {
      const mockError = { errorMsg: 'Test error', errorType: 'GENERAL_ERROR' }
      overmind.actions.setRouterError(mockError)
    })

    test('should transition to ROUTER_READY on ROUTER_INITIALIZED', () => {
      const mockRoute = {
        pattern: '/',
        path: '/',
        routeParams: {},
        params: {},
      }

      overmind.actions.resetRouter({ route: mockRoute, routes: routes })

      expect(overmind.state.matches('ROUTER_READY')).toBeTruthy()
      if (overmind.state.current === 'ROUTER_READY') {
        expect(overmind.state.currentRoute).toEqual(mockRoute)
      }
    })
  })
})
