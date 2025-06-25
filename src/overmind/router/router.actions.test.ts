import { createOvermindMock } from 'overmind'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { config } from '../index'
import { matchRoute, type ParamsT } from './router.effects'
import { routes } from './testRoutes'

// Mock window.location and history
const mockLocation = {
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  href: 'http://localhost:3000/',
}

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}

Object.defineProperty(globalThis, 'location', {
  value: mockLocation,
  writable: true,
})

Object.defineProperty(globalThis, 'history', {
  value: mockHistory,
  writable: true,
})

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    BASE_URL: '/',
  },
})

describe('Router Actions', () => {
  let overmind: ReturnType<typeof createOvermindMock<typeof config>>

  beforeEach(() => {
    // Create mock router effects that mirror the real router effects structure
    const mockRouterEffects = {
      getCurrentRoute: vi.fn(),
      getUrlFromRoute: vi.fn(),
      navigateTo: vi.fn(),
      navigateBack: vi.fn(),
      navigateForward: vi.fn(),
      validateRoute: vi.fn(),
      isValidUrl: vi.fn(),
      isExternalUrl: vi.fn(),
      getRoutePatterns: vi.fn(),
      redirectTo: vi.fn(),
      replaceUrlWithParams: vi.fn(),
    }

    // Set up intelligent mock implementations
    mockRouterEffects.getCurrentRoute.mockImplementation(() => {
      let path = mockLocation.pathname.replace(/\/$/, '')
      path = path === '' ? '/' : path

      let matchResult
      for (const pattern of Object.keys(routes)) {
        const { match, params } = matchRoute(pattern, path)
        if (match) {
          matchResult = { pattern, routeParams: params }
          break
        }
      }
      if (!matchResult) {
        return null // No matching route found
      }

      const { pattern, routeParams } = matchResult
      const routeConfig = routes[pattern]
      const expectedParams = routeConfig?.params || []
      const queryParams: ParamsT = {}
      const urlParams = new URLSearchParams(mockLocation.search)

      for (const paramName of expectedParams) {
        const value = urlParams.get(paramName)
        if (value !== null) {
          queryParams[paramName] = value
        }
      }

      return {
        pattern,
        path,
        params: queryParams,
        routeParams,
      }
    })

    mockRouterEffects.getUrlFromRoute.mockImplementation(
      (pattern: string, routeParams = {}, params = {}) => {
        let path = pattern
        for (const [key, value] of Object.entries(routeParams)) {
          path = path.replace(`:${key}`, String(value))
        }
        let url = 'http://localhost:3000' + path
        if (Object.keys(params).length > 0) {
          const urlParams = new URLSearchParams(
            params as Record<string, string>
          )
          url += '?' + urlParams.toString()
        }
        return url
      }
    )

    mockRouterEffects.validateRoute.mockImplementation((pattern: string) => {
      return pattern in routes
    })

    mockRouterEffects.getRoutePatterns.mockReturnValue(Object.keys(routes))

    // Add mock implementations for navigation methods
    mockRouterEffects.navigateTo.mockImplementation(
      (pattern: string, routeParams = {}, params = {}) => {
        // Build the path from pattern and route params
        let path = pattern
        for (const [key, value] of Object.entries(routeParams)) {
          path = path.replace(`:${key}`, String(value))
        }

        // Update mock location
        mockLocation.pathname = path
        mockLocation.search =
          Object.keys(params).length > 0
            ? '?' +
              new URLSearchParams(params as Record<string, string>).toString()
            : ''
        mockLocation.href = `http://localhost:3000${path}${mockLocation.search}`

        // Call the actual navigation method
        mockHistory.pushState({}, '', mockLocation.href)
      }
    )

    mockRouterEffects.navigateBack.mockImplementation(() => {
      mockHistory.back()
    })

    mockRouterEffects.navigateForward.mockImplementation(() => {
      mockHistory.forward()
    })

    // Create the overmind mock with the router effects
    // The router module exports effects, so we mock them directly
    overmind = createOvermindMock(config, {
      router: mockRouterEffects,
    })

    vi.clearAllMocks()

    // Reset location for each test
    mockLocation.pathname = '/'
    mockLocation.search = ''
    mockLocation.hash = ''
    mockLocation.href = 'http://localhost:3000/'
  })

  describe('initializeRouter', () => {
    test('should initialize router with current route', () => {
      mockLocation.pathname = '/users/123'
      mockLocation.search = '?tab=profile'
      mockLocation.href = 'http://localhost:3000/users/123?tab=profile'

      overmind.actions.router.initializeRouter(routes)

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      expect(
        overmind.state.router.current === 'ROUTER_READY' &&
          overmind.state.router.currentRoute
      ).toEqual({
        pattern: '/users/:id',
        path: '/users/123',
        routeParams: { id: '123' },
        params: { tab: 'profile' },
      })
    })

    test('should handle route not found during initialization', () => {
      mockLocation.pathname = '/invalid/path'
      mockLocation.href = 'http://localhost:3000/invalid/path'

      overmind.actions.router.initializeRouter(routes)

      expect(overmind.state.router.current).toBe('ROUTE_NOT_FOUND')
      expect(
        overmind.state.router.current === 'ROUTE_NOT_FOUND' &&
          overmind.state.router.requestedPath
      ).toBe('/invalid/path')
    })
  })

  describe('navigateTo', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should navigate to simple route', () => {
      overmind.actions.router.navigateTo({ pattern: '/' })

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/'
      )
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      expect(
        overmind.state.router.current === 'ROUTER_READY' &&
          overmind.state.router.currentRoute.pattern
      ).toBe('/')
    })

    test('should navigate to route with parameters', () => {
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
        params: { tab: 'profile' },
      })

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/users/123?tab=profile'
      )
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      expect(
        overmind.state.router.current === 'ROUTER_READY' &&
          overmind.state.router.currentRoute.routeParams
      ).toEqual({
        id: '123',
      })
    })

    test('should handle navigation error for invalid route', () => {
      overmind.actions.router.navigateTo({ pattern: '/invalid/route' })

      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')
      if (overmind.state.router.current === 'NAVIGATION_FAILURE') {
        expect(overmind.state.router.errorMsg).toContain(
          'Invalid route pattern'
        )
        expect(overmind.state.router.errorType).toBe('invalid_pattern')
      }
    })
  })

  describe('navigateBack', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should call history.back()', () => {
      overmind.actions.router.navigateBack()
      expect(mockHistory.back).toHaveBeenCalled()
    })
  })

  describe('navigateForward', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should call history.forward()', () => {
      overmind.actions.router.navigateForward()
      expect(mockHistory.forward).toHaveBeenCalled()
    })
  })

  describe('browser navigation handling', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should handle popstate event', () => {
      mockLocation.pathname = '/users/456'
      mockLocation.search = '?tab=settings'
      mockLocation.href = 'http://localhost:3000/users/456?tab=settings'

      overmind.actions.router.onPopState()

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.routeParams!.id).toBe('456')
        expect(overmind.state.router.currentRoute.params?.tab).toBe('settings')
      }
    })

    test('should handle popstate to route not found', () => {
      mockLocation.pathname = '/invalid/path'
      mockLocation.href = 'http://localhost:3000/invalid/path'

      overmind.actions.router.onPopState()

      expect(overmind.state.router.current).toBe('ROUTE_NOT_FOUND')
      if (overmind.state.router.current === 'ROUTE_NOT_FOUND') {
        expect(overmind.state.router.requestedPath).toBe('/invalid/path')
      }
    })
  })

  describe('complex navigation scenarios', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should handle multiple rapid navigations', () => {
      // First navigation
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe('/users/:id')
        expect(overmind.state.router.currentRoute.routeParams!.id).toBe('123')
      }

      // Second navigation
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '456' },
      })
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.routeParams!.id).toBe('456')
      }

      // Third navigation
      overmind.actions.router.navigateTo({
        pattern: '/clients/:id/cars',
        routeParams: { id: '789' },
      })
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe(
          '/clients/:id/cars'
        )
        expect(overmind.state.router.currentRoute.routeParams!.id).toBe('789')
      }
    })

    test('should preserve state through navigation failure and recovery', () => {
      // Initial successful navigation
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      // Failed navigation
      overmind.actions.router.navigateTo({ pattern: '/invalid/route' })
      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')

      // Recovery navigation
      overmind.actions.router.navigateTo({ pattern: '/login' })
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe('/login')
      }
    })

    test('should handle navigation with complex route parameters', () => {
      overmind.actions.router.navigateTo({
        pattern: '/clients/:id/cars/:carId',
        routeParams: { id: '123', carId: '456' },
        params: { action: 'edit', modal: 'true' },
      })

      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.routeParams).toEqual({
          id: '123',
          carId: '456',
        })
        expect(overmind.state.router.currentRoute.params).toEqual({
          action: 'edit',
          modal: 'true',
        })
      }

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/clients/123/cars/456?action=edit&modal=true'
      )
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should handle navigation errors gracefully', () => {
      // This test expects the actions to handle errors thrown by effects
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      // Since validateRoute returns false for invalid patterns, we expect failure
      overmind.actions.router.navigateTo({
        pattern: '/totally/invalid/pattern',
      })
      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')
    })

    test('should handle popstate errors gracefully', () => {
      // Test popstate with invalid route
      mockLocation.pathname = '/invalid/path'
      mockLocation.href = 'http://localhost:3000/invalid/path'

      overmind.actions.router.onPopState()

      expect(overmind.state.router.current).toBe('ROUTE_NOT_FOUND')
    })
  })

  describe('state transitions', () => {
    test('should follow correct state machine flow', () => {
      // Start in initial state
      expect(overmind.state.router.current).toBe('ROUTER_INITIAL')

      // Initialize
      overmind.actions.router.initializeRouter(routes)
      expect(overmind.state.router.current).toBe('ROUTER_READY')

      // Start navigation
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      // Should complete navigation
      expect(overmind.state.router.current).toBe('ROUTER_READY')
    })
  })
})
