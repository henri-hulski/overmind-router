import { createOvermindMock } from 'overmind'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { config } from '../index'
import type {
  ParamsT,
  ParsedRouteT,
  RoutesT,
  RouteT,
  UserT,
} from './router.effects'
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

  const mockMatchRoute = (pattern: string, path: string) => {
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')

    if (patternParts.length !== pathParts.length) {
      return { match: false, params: {} }
    }

    const params: ParamsT = {}

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]

      if (patternPart.startsWith(':')) {
        params[patternPart.slice(1)] = pathPart
      } else if (patternPart !== pathPart) {
        return { match: false, params: {} }
      }
    }

    return { match: true, params }
  }

  beforeEach(() => {
    overmind = createOvermindMock(config, {
      router: {
        matchRoute: mockMatchRoute,

        getCurrentRoute: (routes: RoutesT) => {
          let path = mockLocation.pathname.replace(/\/$/, '')
          path = path === '' ? '/' : path

          let matchResult
          for (const pattern of Object.keys(routes)) {
            const { match, params } = mockMatchRoute(pattern, path)
            if (match) {
              matchResult = { pattern, routeParams: params }
              break
            }
          }
          if (!matchResult) {
            return null
          }

          const { pattern, routeParams } = matchResult
          const routeConfig = routes[pattern]
          const expectedParams = routeConfig?.params || []

          const result: ParsedRouteT | null = {
            pattern,
            path,
          }

          if (routeParams && Object.keys(routeParams).length > 0) {
            result.routeParams = routeParams
          }

          if (expectedParams.length > 0) {
            const queryParams: ParamsT = {}
            const urlParams = new URLSearchParams(mockLocation.search)

            for (const paramName of expectedParams) {
              const value = urlParams.get(paramName)
              if (value !== null) {
                queryParams[paramName] = value
              }
            }

            result.params = queryParams
          }

          return result
        },

        getUrlFromRoute: (pattern: string, params = {}, routeParams = {}) => {
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
        },

        validateRoute: (pattern: string, routes: RoutesT) => {
          return pattern in routes
        },

        parseRoute: (routeTo: RouteT, routes: RoutesT) => {
          if (typeof routeTo === 'string') {
            if (routeTo.includes('?')) {
              try {
                const url = new URL(routeTo, 'http://localhost:3000')
                let path = url.pathname.replace(/\/$/, '')
                path = path === '' ? '/' : path

                let matchResult
                for (const pattern of Object.keys(routes)) {
                  const { match, params } = mockMatchRoute(pattern, path)
                  if (match) {
                    matchResult = { pattern, routeParams: params }
                    break
                  }
                }

                if (matchResult) {
                  const { pattern, routeParams } = matchResult
                  const routeConfig = routes[pattern]
                  const expectedParams = routeConfig?.params || []

                  const result: ParsedRouteT = {
                    pattern,
                    path: routeTo,
                  }

                  if (routeParams && Object.keys(routeParams).length > 0) {
                    result.routeParams = routeParams
                  }

                  if (expectedParams.length > 0) {
                    const queryParams: ParamsT = {}
                    const urlParams = new URLSearchParams(url.search)

                    for (const paramName of expectedParams) {
                      const value = urlParams.get(paramName)
                      if (value !== null) {
                        queryParams[paramName] = value
                      }
                    }

                    result.params = queryParams
                  }

                  return result
                } else {
                  const [pathPart] = routeTo.split('?')
                  return { pattern: pathPart, path: routeTo }
                }
              } catch {
                const [pathPart] = routeTo.split('?')
                return { pattern: pathPart, path: routeTo }
              }
            } else {
              let matchResult
              for (const pattern of Object.keys(routes)) {
                const { match, params } = mockMatchRoute(pattern, routeTo)
                if (match) {
                  matchResult = { pattern, routeParams: params }
                  break
                }
              }

              if (matchResult) {
                const { pattern, routeParams } = matchResult
                const routeConfig = routes[pattern]
                const expectedParams = routeConfig?.params || []

                const result: ParsedRouteT = {
                  pattern,
                  path: routeTo,
                }

                if (routeParams && Object.keys(routeParams).length > 0) {
                  result.routeParams = routeParams
                }

                if (expectedParams.length > 0) {
                  result.params = {}
                }

                return result
              } else {
                return { pattern: routeTo, path: routeTo }
              }
            }
          } else {
            return { ...routeTo, path: routeTo.pattern }
          }
        },

        getRoutePatterns: () => Object.keys(routes),

        navigateTo: (pattern: string, params = {}, routeParams = {}) => {
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

          const urlObj = new URL(url)
          mockLocation.pathname = urlObj.pathname
          mockLocation.search = urlObj.search
          mockLocation.href = url

          mockHistory.pushState({}, '', url)
        },

        navigateBack: () => {
          mockHistory.back()
        },

        navigateForward: () => {
          mockHistory.forward()
        },

        redirectTo: (pattern: string, params = {}, routeParams = {}) => {
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

          const urlObj = new URL(url)
          mockLocation.pathname = urlObj.pathname
          mockLocation.search = urlObj.search
          mockLocation.href = url
        },
        replaceUrlWithParams: (
          pattern: string,
          params = {},
          routeParams = {}
        ) => {
          let path = pattern
          for (const [key, value] of Object.entries(routeParams)) {
            path = path.replace(`:${key}`, String(value))
          }

          mockLocation.pathname = path
          if (Object.keys(params).length > 0) {
            const urlParams = new URLSearchParams(
              params as Record<string, string>
            )
            mockLocation.search = '?' + urlParams.toString()
          } else {
            mockLocation.search = ''
          }
          mockLocation.href =
            'http://localhost:3000' + path + mockLocation.search

          mockHistory.replaceState({}, '', mockLocation.href)
        },
        isValidUrl: () => true,
        isExternalUrl: () => false,
      },
    })

    vi.clearAllMocks()

    mockLocation.pathname = '/'
    mockLocation.search = ''
    mockLocation.hash = ''
    mockLocation.href = 'http://localhost:3000/'
  })

  describe('mock verification', () => {
    test('should verify mocks are working', () => {
      const mockRouterEffects = overmind.effects.router
      expect(mockRouterEffects.getCurrentRoute).toBeDefined()
      expect(mockRouterEffects.navigateTo).toBeDefined()
      expect(typeof mockRouterEffects.getCurrentRoute).toBe('function')
      expect(typeof mockRouterEffects.navigateTo).toBe('function')
    })
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

  describe('getCurrentRoute', () => {
    test('should return current route', () => {
      overmind.actions.router.initializeRouter(routes)
      const currentRoute = overmind.actions.router.getCurrentRoute()
      expect(currentRoute).toEqual({
        pattern: '/',
        path: '/',
      })
    })

    test('should return null if router not ready', () => {
      const currentRoute = overmind.actions.router.getCurrentRoute()
      expect(currentRoute).toBeNull()
    })
  })

  describe('navigateTo', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should navigate to simple route', () => {
      overmind.actions.router.navigateTo('/')

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
        params: { tab: 'profile' },
        routeParams: { id: '123' },
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
      overmind.actions.router.navigateTo('/invalid/route')

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
        params: { tab: 'profile' },
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
      overmind.actions.router.navigateTo('/invalid/route')
      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')

      // Recovery navigation
      overmind.actions.router.navigateTo('/login')
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe('/login')
      }
    })

    test('should handle navigation with complex route parameters', () => {
      overmind.actions.router.navigateTo({
        pattern: '/clients/:id/cars/:carId',
        params: { action: 'edit', modal: 'true' },
        routeParams: { id: '123', carId: '456' },
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
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      overmind.actions.router.navigateTo('/totally/invalid/pattern')
      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')
    })

    test('should handle popstate errors gracefully', () => {
      mockLocation.pathname = '/invalid/path'
      mockLocation.href = 'http://localhost:3000/invalid/path'

      overmind.actions.router.onPopState()

      expect(overmind.state.router.current).toBe('ROUTE_NOT_FOUND')
    })
  })

  describe('state transitions', () => {
    test('should follow correct state machine flow', () => {
      expect(overmind.state.router.current).toBe('ROUTER_INITIAL')

      overmind.actions.router.initializeRouter(routes)
      expect(overmind.state.router.current).toBe('ROUTER_READY')

      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      expect(overmind.state.router.current).toBe('ROUTER_READY')
    })
  })

  describe('redirectTo', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should redirect to simple route', () => {
      overmind.actions.router.redirectTo('/')

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      expect(
        overmind.state.router.current === 'ROUTER_READY' &&
          overmind.state.router.currentRoute.pattern
      ).toBe('/')
    })

    test('should redirect to route with parameters', () => {
      overmind.actions.router.redirectTo({
        pattern: '/users/:id',
        params: { tab: 'profile' },
        routeParams: { id: '123' },
      })

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      expect(
        overmind.state.router.current === 'ROUTER_READY' &&
          overmind.state.router.currentRoute.routeParams
      ).toEqual({
        id: '123',
      })
    })

    test('should handle redirect error for invalid route', () => {
      overmind.actions.router.redirectTo('/invalid/route')

      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')
      if (overmind.state.router.current === 'NAVIGATION_FAILURE') {
        expect(overmind.state.router.errorMsg).toContain(
          'Invalid route pattern'
        )
        expect(overmind.state.router.errorType).toBe('invalid_pattern')
      }
    })

    test('should redirect with URL string', () => {
      overmind.actions.router.redirectTo('/users/456?tab=settings')

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe('/users/:id')
        expect(overmind.state.router.currentRoute.routeParams!.id).toBe('456')
        expect(overmind.state.router.currentRoute.params?.tab).toBe('settings')
      }
    })
  })

  describe('updateParams', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
      // Start with a route that has parameters
      overmind.actions.router.navigateTo({
        pattern: '/users/:id',
        params: { tab: 'profile' },
        routeParams: { id: '123' },
      })
    })

    test('should update query parameters', () => {
      overmind.actions.router.updateParams({
        params: { tab: 'settings', view: 'detailed' },
      })

      expect(mockLocation.search).toBe('?tab=settings')
      expect(mockLocation.pathname).toBe('/users/123')

      expect(overmind.state.router.current).toBe('ROUTER_READY')
    })

    test('should merge with existing parameters', () => {
      overmind.actions.router.updateParams({
        params: { modal: 'true' },
      })

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.params).toEqual({
          tab: 'profile',
        })
      }
    })

    test('should handle updateParams when not in ROUTER_READY state', () => {
      const notReadyOvermind = createOvermindMock(
        config,
        {
          router: {
            matchRoute: mockMatchRoute,
            getCurrentRoute: () => null,
            getUrlFromRoute: (
              pattern: string,
              params = {},
              routeParams = {}
            ) => {
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
            },
            validateRoute: (pattern: string, routes: RoutesT) =>
              pattern in routes,
            parseRoute: (routeTo: RouteT) =>
              typeof routeTo === 'string'
                ? { pattern: routeTo, path: routeTo }
                : { ...routeTo, path: '/mock-path' },
            navigateTo: vi.fn(),
            redirectTo: vi.fn(),
          },
        },
        (state) => {
          state.router.current = 'ROUTE_NOT_FOUND'
          if (state.router.current === 'ROUTE_NOT_FOUND') {
            state.router.requestedPath = '/invalid'
            state.router.currentRoute = undefined
          }
        }
      )

      notReadyOvermind.actions.router.updateParams({
        params: { test: 'value' },
      })

      expect(notReadyOvermind.state.router.current).toBe('ROUTE_NOT_FOUND')
    })
  })

  describe('URL string navigation', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should navigate using URL string with query parameters', () => {
      overmind.actions.router.navigateTo('/users/123?tab=profile')

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe('/users/:id')
        expect(overmind.state.router.currentRoute.routeParams!.id).toBe('123')
        expect(overmind.state.router.currentRoute.params?.tab).toBe('profile')
      }
    })

    test('should navigate using URL string without query parameters', () => {
      overmind.actions.router.navigateTo('/login')

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe('/login')
        expect(overmind.state.router.currentRoute.params).toEqual({}) // Route has expected query params, so include empty object
        expect(overmind.state.router.currentRoute.routeParams).toBeUndefined() // No route params in URL path
      }
    })

    test('should navigate using complex URL string', () => {
      overmind.actions.router.navigateTo(
        '/clients/456/cars/789?action=edit&modal=true'
      )

      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute.pattern).toBe(
          '/clients/:id/cars/:carId'
        )
        expect(overmind.state.router.currentRoute.routeParams).toEqual({
          id: '456',
          carId: '789',
        })
        expect(overmind.state.router.currentRoute.params).toEqual({
          action: 'edit',
          modal: 'true',
        })
      }
    })

    test('should handle malformed URL string', () => {
      overmind.actions.router.navigateTo('not-a-valid-url?but&has=params')

      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')
      if (overmind.state.router.current === 'NAVIGATION_FAILURE') {
        expect(overmind.state.router.errorMsg).toContain(
          'Invalid route pattern'
        )
      }
    })
  })

  describe('advanced error handling', () => {
    beforeEach(() => {
      overmind.actions.router.initializeRouter(routes)
    })

    test('should handle browser navigation errors in navigateBack', () => {
      const originalBack = mockHistory.back
      mockHistory.back = vi.fn(() => {
        throw new Error('Browser navigation failed')
      })

      try {
        overmind.actions.router.navigateBack()

        expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')
        if (overmind.state.router.current === 'NAVIGATION_FAILURE') {
          expect(overmind.state.router.errorMsg).toContain(
            'Browser navigation failed'
          )
          expect(overmind.state.router.errorType).toBe(
            'browser_navigation_error'
          )
        }
      } finally {
        mockHistory.back = originalBack
      }
    })

    test('should handle browser navigation errors in navigateForward', () => {
      const originalForward = mockHistory.forward
      mockHistory.forward = vi.fn(() => {
        throw new Error('Forward navigation failed')
      })

      try {
        overmind.actions.router.navigateForward()

        expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')
        if (overmind.state.router.current === 'NAVIGATION_FAILURE') {
          expect(overmind.state.router.errorMsg).toContain(
            'Forward navigation failed'
          )
          expect(overmind.state.router.errorType).toBe(
            'browser_navigation_error'
          )
        }
      } finally {
        mockHistory.forward = originalForward
      }
    })

    test('should handle navigation error in navigateTo', () => {
      const errorOvermind = createOvermindMock(config, {
        router: {
          matchRoute: mockMatchRoute,
          getCurrentRoute: () => ({
            pattern: '/',
            path: '/',
            params: {},
            routeParams: {},
          }),
          getUrlFromRoute: (pattern: string, params = {}, routeParams = {}) => {
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
          },
          validateRoute: (pattern: string, routes: RoutesT) =>
            pattern in routes,
          parseRoute: (routeTo: RouteT) =>
            typeof routeTo === 'string'
              ? { pattern: routeTo, path: routeTo }
              : { ...routeTo, path: '/mock-path' },
          navigateTo: () => {
            throw new Error('Navigation failed')
          },
          redirectTo: vi.fn(),
        },
      })

      errorOvermind.actions.router.initializeRouter(routes)

      errorOvermind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      expect(errorOvermind.state.router.current).toBe('NAVIGATION_FAILURE')
      if (errorOvermind.state.router.current === 'NAVIGATION_FAILURE') {
        expect(errorOvermind.state.router.errorMsg).toContain(
          'Navigation failed'
        )
        expect(errorOvermind.state.router.errorType).toBe('navigation_error')
      }
    })

    test('should handle redirect error in redirectTo', () => {
      const errorOvermind = createOvermindMock(config, {
        router: {
          matchRoute: mockMatchRoute,
          getCurrentRoute: () => ({
            pattern: '/',
            path: '/',
            params: {},
            routeParams: {},
          }),
          getUrlFromRoute: (pattern: string, params = {}, routeParams = {}) => {
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
          },
          validateRoute: (pattern: string, routes: RoutesT) =>
            pattern in routes,
          parseRoute: (routeTo: RouteT) =>
            typeof routeTo === 'string'
              ? { pattern: routeTo, path: routeTo }
              : { ...routeTo, path: '/mock-path' },
          navigateTo: vi.fn(),
          redirectTo: () => {
            throw new Error('Redirect failed')
          },
        },
      })

      errorOvermind.actions.router.initializeRouter(routes)

      errorOvermind.actions.router.redirectTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      expect(errorOvermind.state.router.current).toBe('NAVIGATION_FAILURE')
      if (errorOvermind.state.router.current === 'NAVIGATION_FAILURE') {
        expect(errorOvermind.state.router.errorMsg).toContain('Redirect failed')
        expect(errorOvermind.state.router.errorType).toBe('redirect_error')
      }
    })

    test('should handle getCurrentRoute returning null during navigation', () => {
      let callCount = 0
      const errorOvermind = createOvermindMock(config, {
        router: {
          matchRoute: mockMatchRoute,
          getCurrentRoute: () => {
            callCount++
            if (callCount === 1) {
              return {
                pattern: '/',
                path: '/',
                params: {},
                routeParams: {},
              }
            }
            return null
          },
          getUrlFromRoute: (pattern: string, params = {}, routeParams = {}) => {
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
          },
          validateRoute: (pattern: string, routes: RoutesT) =>
            pattern in routes,
          parseRoute: (routeTo: RouteT) =>
            typeof routeTo === 'string'
              ? { pattern: routeTo, path: routeTo }
              : { ...routeTo, path: '/mock-path' },
          navigateTo: vi.fn(),
          redirectTo: vi.fn(),
        },
      })

      errorOvermind.actions.router.initializeRouter(routes)

      errorOvermind.actions.router.navigateTo({
        pattern: '/users/:id',
        routeParams: { id: '123' },
      })

      expect(errorOvermind.state.router.current).toBe('ROUTE_NOT_FOUND')
      if (errorOvermind.state.router.current === 'ROUTE_NOT_FOUND') {
        expect(errorOvermind.state.router.requestedPath).toBeDefined()
      }
    })

    test('should handle getCurrentRoute returning null during browser navigation', () => {
      const errorOvermind = createOvermindMock(config, {
        router: {
          matchRoute: mockMatchRoute,
          getCurrentRoute: () => null,
          getUrlFromRoute: (pattern: string, params = {}, routeParams = {}) => {
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
          },
          validateRoute: (pattern: string, routes: RoutesT) =>
            pattern in routes,
          parseRoute: (routeTo: RouteT) =>
            typeof routeTo === 'string'
              ? { pattern: routeTo, path: routeTo }
              : { ...routeTo, path: '/mock-path' },
          navigateTo: vi.fn(),
          redirectTo: vi.fn(),
          navigateBack: vi.fn(),
        },
      })

      errorOvermind.actions.router.navigateBack()

      expect(errorOvermind.state.router.current).toBe('ROUTE_NOT_FOUND')
      if (errorOvermind.state.router.current === 'ROUTE_NOT_FOUND') {
        expect(errorOvermind.state.router.requestedPath).toBe(
          window.location.pathname
        )
      }
    })
  })

  describe('state machine transitions from different states', () => {
    test('should handle navigation from NAVIGATION_FAILURE state', () => {
      overmind.actions.router.initializeRouter(routes)

      overmind.actions.router.navigateTo('/invalid/pattern')
      expect(overmind.state.router.current).toBe('NAVIGATION_FAILURE')

      overmind.actions.router.navigateTo('/')
      expect(overmind.state.router.current).toBe('ROUTER_READY')
    })

    test('should handle navigation from ROUTE_NOT_FOUND state', () => {
      overmind.actions.router.initializeRouter(routes)

      mockLocation.pathname = '/invalid/path'
      mockLocation.href = 'http://localhost:3000/invalid/path'
      overmind.actions.router.onPopState()
      expect(overmind.state.router.current).toBe('ROUTE_NOT_FOUND')

      overmind.actions.router.navigateTo('/')
      expect(overmind.state.router.current).toBe('ROUTER_READY')
    })

    test('should handle router initialization from NAVIGATION_FAILURE state', () => {
      const failureOvermind = createOvermindMock(
        config,
        {
          router: {
            matchRoute: mockMatchRoute,
            getCurrentRoute: (routes) => {
              let path = mockLocation.pathname.replace(/\/$/, '')
              path = path === '' ? '/' : path

              let matchResult
              for (const pattern of Object.keys(routes)) {
                const { match, params } = mockMatchRoute(pattern, path)
                if (match) {
                  matchResult = { pattern, routeParams: params }
                  break
                }
              }
              if (!matchResult) {
                return null
              }

              const { pattern, routeParams } = matchResult
              const routeConfig = routes[pattern]
              const expectedParams = routeConfig?.params || []

              const result: ParsedRouteT | null = {
                pattern,
                path,
              }

              if (routeParams && Object.keys(routeParams).length > 0) {
                result.routeParams = routeParams
              }

              if (expectedParams.length > 0) {
                const queryParams: ParamsT = {}
                const urlParams = new URLSearchParams(mockLocation.search)

                for (const paramName of expectedParams) {
                  const value = urlParams.get(paramName)
                  if (value !== null) {
                    queryParams[paramName] = value
                  }
                }

                result.params = queryParams
              }

              return result
            },
            getUrlFromRoute: (
              pattern: string,
              params = {},
              routeParams = {}
            ) => {
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
            },
            validateRoute: (pattern: string, routes: RoutesT) =>
              pattern in routes,
            parseRoute: (routeTo: RouteT, routes: RoutesT) => {
              if (typeof routeTo === 'string') {
                if (routeTo.includes('?')) {
                  try {
                    const url = new URL(routeTo, 'http://localhost:3000')
                    let path = url.pathname.replace(/\/$/, '')
                    path = path === '' ? '/' : path

                    let matchResult
                    for (const pattern of Object.keys(routes)) {
                      const { match, params } = mockMatchRoute(pattern, path)
                      if (match) {
                        matchResult = { pattern, routeParams: params }
                        break
                      }
                    }

                    if (matchResult) {
                      const { pattern, routeParams } = matchResult
                      const routeConfig = routes[pattern]
                      const expectedParams = routeConfig?.params || []

                      const result: ParsedRouteT = {
                        pattern,
                        path: routeTo,
                      }

                      if (routeParams && Object.keys(routeParams).length > 0) {
                        result.routeParams = routeParams
                      }

                      if (expectedParams.length > 0) {
                        const queryParams: ParamsT = {}
                        const urlParams = new URLSearchParams(url.search)

                        for (const paramName of expectedParams) {
                          const value = urlParams.get(paramName)
                          if (value !== null) {
                            queryParams[paramName] = value
                          }
                        }

                        result.params = queryParams
                      }

                      return result
                    } else {
                      const [pathPart] = routeTo.split('?')
                      return { pattern: pathPart, path: routeTo }
                    }
                  } catch {
                    const [pathPart] = routeTo.split('?')
                    return { pattern: pathPart, path: routeTo }
                  }
                } else {
                  let matchResult
                  for (const pattern of Object.keys(routes)) {
                    const { match, params } = mockMatchRoute(pattern, routeTo)
                    if (match) {
                      matchResult = { pattern, routeParams: params }
                      break
                    }
                  }

                  if (matchResult) {
                    const { pattern, routeParams } = matchResult
                    const routeConfig = routes[pattern]
                    const expectedParams = routeConfig?.params || []

                    const result: ParsedRouteT = {
                      pattern,
                      path: routeTo,
                    }

                    if (routeParams && Object.keys(routeParams).length > 0) {
                      result.routeParams = routeParams
                    }

                    if (expectedParams.length > 0) {
                      result.params = {}
                    }

                    return result
                  } else {
                    return { pattern: routeTo, path: routeTo }
                  }
                }
              } else {
                return { ...routeTo, path: routeTo.pattern }
              }
            },
            navigateTo: vi.fn(),
            redirectTo: vi.fn(),
          },
        },
        (state) => {
          state.router.current = 'NAVIGATION_FAILURE'
          if (state.router.current === 'NAVIGATION_FAILURE') {
            state.router.errorMsg = 'Test error'
            state.router.errorType = 'test'
            state.router.currentRoute = undefined
          }
        }
      )

      mockLocation.pathname = '/'
      mockLocation.href = 'http://localhost:3000/'
      failureOvermind.actions.router.initializeRouter(routes)
      expect(failureOvermind.state.router.current).toBe('ROUTER_READY')
    })
  })

  describe('Route Guards', () => {
    const authenticatedUser = { id: '1', email: 'user@example.com' }
    const adminUser = { id: '2', email: 'admin@example.com', isAdmin: true }
    const managerUser = {
      id: '3',
      email: 'manager@example.com',
      isManager: true,
    }

    const hasAdminRole = (user: UserT) => user && !!user.isAdmin
    const hasManagerRole = (user: UserT) =>
      user && !!(user.isAdmin || user.isManager)

    const guardRoutes: RoutesT = {
      '/': { params: [] },
      '/public': { params: [] },
      '/protected': { params: [], requiresAuth: true },
      '/admin': {
        params: [],
        requiresAuth: true,
        guard: hasAdminRole,
      },
      '/management': {
        params: [],
        requiresAuth: true,
        guard: hasManagerRole,
      },
    }

    beforeEach(() => {
      overmind = createOvermindMock(config, {
        router: {
          matchRoute: mockMatchRoute,
          getCurrentRoute: () => null,
        },
      })
      overmind.actions.router.initializeRouter(guardRoutes)
    })

    test('allows access to public routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/public']!,
        user: null,
      })
      expect(result.allowed).toBe(true)
    })

    test('blocks unauthenticated users from protected routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/protected']!,
        user: null,
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('authentication')
    })

    test('allows authenticated users to protected routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/protected']!,
        user: authenticatedUser,
      })
      expect(result.allowed).toBe(true)
    })

    test('blocks non-admin users from admin routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/admin']!,
        user: authenticatedUser,
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('authorization')
    })

    test('allows admin users to admin routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/admin']!,
        user: adminUser,
      })
      expect(result.allowed).toBe(true)
    })

    test('allows managers to management routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/management']!,
        user: managerUser,
      })
      expect(result.allowed).toBe(true)
    })

    test('allows admins to management routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/management']!,
        user: adminUser,
      })
      expect(result.allowed).toBe(true)
    })

    test('blocks regular users from management routes', () => {
      const result = overmind.actions.router.checkRouteAccess({
        routeConfig: guardRoutes['/management']!,
        user: authenticatedUser,
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('authorization')
    })
  })
})
