import { createOvermindMock } from 'overmind'
import {
  type ParamsT,
  type ParsedRouteT,
  type RoutesT,
  type RouteT,
} from 'overmind-router'
import { describe, expect, test, vi } from 'vitest'

import { config } from '../../overmind'

const routes: RoutesT = {
  '/': {},
  '/clients': {},
  '/clients/new': {},
  '/clients/:id': { params: ['id'] },
  '/clients/:id/edit': { params: ['id'] },
  '/admin': { requiresAuth: true },
  '/login': {},
}

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

// Mock browser APIs
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
  href: 'http://localhost:3000/',
}

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true,
})

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('Router Module (Direct Test)', () => {
  let app: ReturnType<typeof createOvermindMock<typeof config>>

  test('should initialize router with current route', () => {
    app = createOvermindMock(
      config,
      {
        router: {
          matchRoute: mockMatchRoute,
          getCurrentRoute: (routesArg: RoutesT) => {
            let path = mockLocation.pathname.replace(/\/$/, '')
            path = path === '' ? '/' : path

            for (const pattern of Object.keys(routesArg)) {
              const { match, params } = mockMatchRoute(pattern, path)
              if (match) {
                return { pattern, path, routeParams: params } as ParsedRouteT
              }
            }
            return null
          },
          getUrlFromRoute: () => 'http://localhost:3000/',
          setUrlFromRoute: () => {},
          validateRoute: (pattern: string, routesArg: RoutesT) =>
            pattern in routesArg,
          parseRoute: (routeTo: RouteT) =>
            typeof routeTo === 'string'
              ? { pattern: routeTo, path: routeTo }
              : { ...routeTo, path: routeTo.pattern },
          navigateTo: vi.fn(),
          navigateToUrl: vi.fn(),
          navigateBack: vi.fn(),
          navigateForward: vi.fn(),
          redirectTo: vi.fn(),
          redirectToUrl: vi.fn(),
          replaceUrlWithParams: vi.fn(),
          isValidUrl: () => true,
          isExternalUrl: () => false,
          getRoutePatterns: () => Object.keys(routes),
        },
      },
      (state) => {
        state.router.routes = routes
      }
    )

    app.actions.router.initializeRouter(routes)

    expect(app.state.router.current).toBe('ROUTER_READY')
  })

  test('should navigate to a valid route', () => {
    const app = createOvermindMock(
      config,
      {
        router: {
          matchRoute: mockMatchRoute,
          getCurrentRoute: (routesArg: RoutesT) => {
            let path = mockLocation.pathname.replace(/\/$/, '')
            path = path === '' ? '/' : path

            for (const pattern of Object.keys(routesArg)) {
              const { match, params } = mockMatchRoute(pattern, path)
              if (match) {
                return { pattern, path, routeParams: params } as ParsedRouteT
              }
            }
            return null
          },
          getUrlFromRoute: () => 'http://localhost:3000/clients',
          setUrlFromRoute: () => {},
          validateRoute: (pattern: string, routesArg: RoutesT) =>
            pattern in routesArg,
          parseRoute: (routeTo: RouteT) => {
            if (typeof routeTo === 'string') {
              return { pattern: routeTo, path: routeTo }
            }
            return { ...routeTo, path: routeTo.pattern }
          },
          navigateTo: vi.fn(() => {
            mockLocation.pathname = '/clients'
            mockLocation.href = 'http://localhost:3000/clients'
          }),
          navigateToUrl: vi.fn(),
          navigateBack: vi.fn(),
          navigateForward: vi.fn(),
          redirectTo: vi.fn(),
          redirectToUrl: vi.fn(),
          replaceUrlWithParams: vi.fn(),
          isValidUrl: () => true,
          isExternalUrl: () => false,
          getRoutePatterns: () => Object.keys(routes),
        },
      },
      (state) => {
        state.router.routes = routes
        state.router.current = 'ROUTER_READY'
        if (state.router.current === 'ROUTER_READY') {
          state.router.currentRoute = { pattern: '/', path: '/' }
        }
      }
    )

    app.actions.router.navigateTo('/clients')

    expect(
      app.state.router.current === 'ROUTER_READY' &&
        app.state.router.currentRoute
    ).toEqual({
      pattern: '/clients',
      path: '/clients',
      routeParams: {},
    })

    const currentRoute = app.actions.router.getCurrentRoute()

    expect(currentRoute).toEqual({
      pattern: '/clients',
      path: '/clients',
      routeParams: {},
    })
  })
})
