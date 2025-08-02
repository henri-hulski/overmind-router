import { render, screen } from '@testing-library/react'
import { createOvermindMock } from 'overmind'
import { Provider } from 'overmind-react'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import App from '../../components/App'
import { config } from '../../overmind'
import type {
  ParamsT,
  ParsedRouteT,
  RoutesT,
  RouteT,
} from '../../overmind/router/router.effects'
import { routes } from '../../routes'

// Mock browser APIs
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}

const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
  href: 'http://localhost:3000/',
}

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true,
})

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock child components for focused testing
vi.mock('../../components/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard Component</div>,
}))

vi.mock('../../components/ClientList', () => ({
  ClientList: () => <div data-testid="client-list">Client List Component</div>,
}))

vi.mock('../../components/ClientNew', () => ({
  ClientNew: () => <div data-testid="client-new">Client New Component</div>,
}))

vi.mock('../../components/ClientDetail', () => ({
  ClientDetail: ({ clientId }: { clientId: number }) => (
    <div data-testid="client-detail">Client Detail: {clientId}</div>
  ),
}))

vi.mock('../../components/ClientEdit', () => ({
  ClientEdit: ({ clientId }: { clientId: number }) => (
    <div data-testid="client-edit">Client Edit: {clientId}</div>
  ),
}))

vi.mock('../../components/Login', () => ({
  Login: () => <div data-testid="login">Login Component</div>,
}))

vi.mock('../../components/Admin', () => ({
  Admin: () => <div data-testid="admin">Admin Component</div>,
}))

describe('Router Integration Tests', () => {
  let overmind: ReturnType<typeof createOvermindMock<typeof config>>

  // Mock browser APIs
  const mockHistory = {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }

  const mockLocation = {
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000/',
  }

  Object.defineProperty(window, 'history', {
    value: mockHistory,
    writable: true,
  })

  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  })

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

  const renderApp = () => {
    return render(
      <Provider value={overmind}>
        <App />
      </Provider>
    )
  }

  beforeEach(() => {
    overmind = createOvermindMock(
      config,
      {
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

            const result: ParsedRouteT = {
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
        clients: {
          api: {
            getClients: vi.fn(() => Promise.resolve([])),
            getClientById: vi.fn(() => Promise.resolve(null)),
            createClient: vi.fn(() =>
              Promise.resolve({
                id: 1,
                name: 'Test',
                company: 'Test',
                email: 'test@example.com',
                phone: '+1-555-0000',
                address: '123 Test St',
                status: 'Active' as const,
                createdAt: '2024-01-01',
              })
            ),
            updateClient: vi.fn(() =>
              Promise.resolve({
                id: 1,
                name: 'Test',
                company: 'Test',
                email: 'test@example.com',
                phone: '+1-555-0000',
                address: '123 Test St',
                status: 'Active' as const,
                createdAt: '2024-01-01',
              })
            ),
            deleteClient: vi.fn(() => Promise.resolve()),
          },
        },
        auth: {
          authenticateUser: vi.fn(() =>
            Promise.resolve({
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
              isAdmin: false,
              isManager: false,
              roles: [],
            })
          ),
          getCurrentUser: vi.fn(() =>
            Promise.resolve({
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
              isAdmin: false,
              isManager: false,
              roles: [],
            })
          ),
          logout: vi.fn(() => Promise.resolve()),
        },
      },
      (state) => {
        // Initialize app state machine
        state.app.current = 'APP_READY'

        // Initialize router state machine
        state.router.current = 'ROUTER_READY'

        // Set router ready state properties
        if (state.router.current === 'ROUTER_READY') {
          state.router.currentRoute = { pattern: '/', path: '/' }
          state.router.routes = routes
        }

        // Initialize clients state machine
        state.clients.current = 'FETCH_CLIENTS_SUCCESS'
        if (state.clients.current === 'FETCH_CLIENTS_SUCCESS') {
          state.clients.clients = []
          state.clients.selectedClient = null
          state.clients.error = null
        }

        // Initialize auth state
        state.auth.current = 'AUTHENTICATED'
        if (state.auth.current === 'AUTHENTICATED') {
          state.auth.user = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            isAdmin: false,
            isManager: false,
            roles: [],
          }
        }
      }
    )

    vi.clearAllMocks()
    mockLocation.pathname = '/'
    mockLocation.search = ''
    mockLocation.href = 'http://localhost:3000/'
  })

  describe('App Initialization and Router Setup', () => {
    test('should initialize app and router correctly', () => {
      renderApp()

      // App should initialize
      expect(overmind.state.app.current).toBe('APP_READY')

      // Router should be ready with current route
      expect(overmind.state.router.current).toBe('ROUTER_READY')
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute).toBeDefined()
        expect(overmind.state.router.currentRoute?.pattern).toBe('/')
      }

      // Dashboard should be rendered
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })

    test('should handle different initial routes', () => {
      // Update mock location to simulate starting on /clients
      mockLocation.pathname = '/clients'
      mockLocation.href = 'http://localhost:3000/clients'

      // Create new mock with different route
      overmind = createOvermindMock(
        config,
        {
          router: {
            matchRoute: mockMatchRoute,
            getCurrentRoute: () => ({
              pattern: '/clients',
              path: '/clients',
            }),
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
                : { ...routeTo, path: routeTo.pattern },
            getRoutePatterns: () => Object.keys(routes),
            navigateTo: vi.fn(),
            navigateBack: vi.fn(),
            navigateForward: vi.fn(),
            redirectTo: vi.fn(),
            replaceUrlWithParams: vi.fn(),
            isValidUrl: () => true,
            isExternalUrl: () => false,
          },
          clients: {
            api: {
              getClients: vi.fn(() => Promise.resolve([])),
              getClientById: vi.fn(() => Promise.resolve(null)),
              createClient: vi.fn(() =>
                Promise.resolve({
                  id: 1,
                  name: 'Test',
                  company: 'Test',
                  email: 'test@example.com',
                  phone: '+1-555-0000',
                  address: '123 Test St',
                  status: 'Active' as const,
                  createdAt: '2024-01-01',
                })
              ),
              updateClient: vi.fn(() =>
                Promise.resolve({
                  id: 1,
                  name: 'Test',
                  company: 'Test',
                  email: 'test@example.com',
                  phone: '+1-555-0000',
                  address: '123 Test St',
                  status: 'Active' as const,
                  createdAt: '2024-01-01',
                })
              ),
              deleteClient: vi.fn(() => Promise.resolve()),
            },
          },
          auth: {
            authenticateUser: vi.fn(() =>
              Promise.resolve({
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                isAdmin: false,
                isManager: false,
                roles: [],
              })
            ),
            getCurrentUser: vi.fn(() =>
              Promise.resolve({
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                isAdmin: false,
                isManager: false,
                roles: [],
              })
            ),
            logout: vi.fn(() => Promise.resolve()),
          },
        },
        (state) => {
          state.app.current = 'APP_READY'
          state.router.current = 'ROUTER_READY'

          if (state.router.current === 'ROUTER_READY') {
            state.router.currentRoute = {
              pattern: '/clients',
              path: '/clients',
            }
            state.router.routes = routes
          }

          state.clients.current = 'FETCH_CLIENTS_SUCCESS'
          if (state.clients.current === 'FETCH_CLIENTS_SUCCESS') {
            state.clients.clients = []
            state.clients.selectedClient = null
            state.clients.error = null
          }

          // Initialize auth state
          state.auth.current = 'AUTHENTICATED'
          if (state.auth.current === 'AUTHENTICATED') {
            state.auth.user = {
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
              isAdmin: false,
              isManager: false,
              roles: [],
            }
          }
        }
      )

      renderApp()

      expect(overmind.state.app.current).toBe('APP_READY')
      expect(overmind.state.router.current).toBe('ROUTER_READY')

      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute?.pattern).toBe('/clients')
      }

      expect(screen.getByTestId('client-list')).toBeInTheDocument()
    })
  })

  describe('Navigation Flow', () => {
    test('should navigate through different routes correctly', () => {
      renderApp()

      // Start at dashboard
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      if (overmind.state.router.current === 'ROUTER_READY') {
        expect(overmind.state.router.currentRoute?.pattern).toBe('/')
      }

      // Test that navigation action can be called
      overmind.actions.router.navigateTo('/clients')

      // Verify the router effect was called
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/clients'
      )
    })

    test('should handle programmatic navigation with route params', () => {
      renderApp()

      // Simulate navigation action call
      overmind.actions.router.navigateTo({
        pattern: '/clients/:id',
        routeParams: { id: '123' },
      })

      // Verify the router effect was called with correct parameters
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/clients/123'
      )
    })

    test('should handle navigation with query parameters', () => {
      renderApp()

      // Simulate navigation with params
      overmind.actions.router.navigateTo({
        pattern: '/clients',
        params: { search: 'test', filter: 'active' },
      })

      // Verify the router effect was called with query parameters
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/clients?search=test&filter=active'
      )
    })
  })

  describe('Browser Navigation', () => {
    test('should handle browser back navigation', () => {
      renderApp()

      overmind.actions.router.navigateBack()
      expect(mockHistory.back).toHaveBeenCalled()
    })

    test('should handle browser forward navigation', () => {
      renderApp()

      overmind.actions.router.navigateForward()
      expect(mockHistory.forward).toHaveBeenCalled()
    })
  })
})
