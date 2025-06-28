import { fireEvent, render, screen } from '@testing-library/react'
import { createOvermindMock } from 'overmind'
import { Provider } from 'overmind-react'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { config, useActions, useAppState } from '../../overmind'
import type {
  ParamsT,
  ParsedRouteT,
  RoutesT,
  RouteToT,
} from '../../overmind/router/router.effects'
import { routes } from '../../routes'

/**
 * Test component that demonstrates different router usage patterns
 */
const RouterUsageExample: React.FC = () => {
  const actions = useActions()
  const state = useAppState()

  return (
    <div data-testid="router-usage-example">
      <h1>Router Usage Examples</h1>

      {/* Navigation with string patterns */}
      <button
        onClick={() => actions.router.navigateTo('/')}
        data-testid="nav-home-string"
      >
        Home (String)
      </button>

      {/* Navigation with route objects */}
      <button
        onClick={() => actions.router.navigateTo({ pattern: '/clients' })}
        data-testid="nav-clients-object"
      >
        Clients (Object)
      </button>

      {/* Navigation with route parameters */}
      <button
        onClick={() =>
          actions.router.navigateTo({
            pattern: '/clients/:id',
            routeParams: { id: '123' },
            params: { tab: 'details' },
          })
        }
        data-testid="nav-client-detail"
      >
        Client Detail with Params
      </button>

      {/* Navigation with URL strings */}
      <button
        onClick={() => actions.router.navigateTo('/clients/456?tab=edit')}
        data-testid="nav-url-string"
      >
        URL String Navigation
      </button>

      {/* Redirect examples */}
      <button
        onClick={() => actions.router.redirectTo({ pattern: '/clients/new' })}
        data-testid="redirect-new-client"
      >
        Redirect to New Client
      </button>

      {/* Parameter updates */}
      <button
        onClick={() =>
          actions.router.updateParams({
            params: { search: 'test', page: '2' },
          })
        }
        data-testid="update-params"
      >
        Update Parameters
      </button>

      {/* Browser navigation */}
      <button
        onClick={() => actions.router.navigateBack()}
        data-testid="nav-back"
      >
        Back
      </button>

      <button
        onClick={() => actions.router.navigateForward()}
        data-testid="nav-forward"
      >
        Forward
      </button>

      {/* Current route display */}
      <div data-testid="current-route">
        Current Pattern:{' '}
        {state.router.current === 'ROUTER_READY'
          ? state.router.currentRoute?.pattern
          : 'N/A'}
      </div>

      <div data-testid="current-params">
        Current Params:{' '}
        {JSON.stringify(
          state.router.current === 'ROUTER_READY'
            ? state.router.currentRoute?.params || {}
            : {}
        )}
      </div>

      <div data-testid="route-params">
        Route Params:{' '}
        {JSON.stringify(
          state.router.current === 'ROUTER_READY'
            ? state.router.currentRoute?.routeParams || {}
            : {}
        )}
      </div>
    </div>
  )
}

describe('Router Usage Patterns', () => {
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

  const renderExample = () => {
    return render(
      <Provider value={overmind}>
        <RouterUsageExample />
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
          parseRoute: (routeTo: RouteToT, routes: RoutesT) => {
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
            getClients: () => Promise.resolve([]),
            getClientById: () => Promise.resolve(null),
            createClient: () =>
              Promise.resolve({
                id: 1,
                name: 'Test',
                company: 'Test',
                email: 'test@example.com',
                phone: '+1-555-0000',
                address: '123 Test St',
                status: 'Active',
                createdAt: '2024-01-01',
              }),
            updateClient: () =>
              Promise.resolve({
                id: 1,
                name: 'Test',
                company: 'Test',
                email: 'test@example.com',
                phone: '+1-555-0000',
                address: '123 Test St',
                status: 'Active',
                createdAt: '2024-01-01',
              }),
            deleteClient: () => Promise.resolve(),
          },
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
      }
    )

    vi.clearAllMocks()
    mockLocation.pathname = '/'
    mockLocation.search = ''
    mockLocation.href = 'http://localhost:3000/'
  })

  describe('Navigation Methods', () => {
    test('should handle string pattern navigation', () => {
      renderExample()

      const button = screen.getByTestId('nav-home-string')
      fireEvent.click(button)

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/'
      )
    })

    test('should handle object pattern navigation', () => {
      renderExample()

      const button = screen.getByTestId('nav-clients-object')
      fireEvent.click(button)

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/clients'
      )
    })

    test('should handle navigation with route and query parameters', () => {
      renderExample()

      const button = screen.getByTestId('nav-client-detail')
      fireEvent.click(button)

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/clients/123?tab=details'
      )
    })

    test('should handle URL string navigation', () => {
      renderExample()

      const button = screen.getByTestId('nav-url-string')
      fireEvent.click(button)

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/clients/456?tab=edit'
      )
    })
  })

  describe('Redirect Methods', () => {
    test('should handle redirect with route object', () => {
      renderExample()

      const button = screen.getByTestId('redirect-new-client')
      fireEvent.click(button)

      // Redirect updates location but doesn't use pushState
      expect(mockLocation.pathname).toBe('/clients/new')
      expect(mockLocation.href).toBe('http://localhost:3000/clients/new')
    })
  })

  describe('Browser Navigation', () => {
    test('should handle browser back navigation', () => {
      renderExample()

      const button = screen.getByTestId('nav-back')
      fireEvent.click(button)

      expect(mockHistory.back).toHaveBeenCalled()
    })

    test('should handle browser forward navigation', () => {
      renderExample()

      const button = screen.getByTestId('nav-forward')
      fireEvent.click(button)

      expect(mockHistory.forward).toHaveBeenCalled()
    })
  })

  describe('Route State Display', () => {
    test('should display current route information', () => {
      renderExample()

      expect(screen.getByTestId('current-route')).toHaveTextContent(
        'Current Pattern: /'
      )
      expect(screen.getByTestId('current-params')).toHaveTextContent(
        'Current Params: {}'
      )
      expect(screen.getByTestId('route-params')).toHaveTextContent(
        'Route Params: {}'
      )
    })

    test('should handle router not ready state', () => {
      overmind = createOvermindMock(
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
            parseRoute: (routeTo: RouteToT) =>
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
              getClients: () => Promise.resolve([]),
              getClientById: () => Promise.resolve(null),
              createClient: () =>
                Promise.resolve({
                  id: 1,
                  name: 'Test',
                  company: 'Test',
                  email: 'test@example.com',
                  phone: '+1-555-0000',
                  address: '123 Test St',
                  status: 'Active',
                  createdAt: '2024-01-01',
                }),
              updateClient: () =>
                Promise.resolve({
                  id: 1,
                  name: 'Test',
                  company: 'Test',
                  email: 'test@example.com',
                  phone: '+1-555-0000',
                  address: '123 Test St',
                  status: 'Active',
                  createdAt: '2024-01-01',
                }),
              deleteClient: () => Promise.resolve(),
            },
          },
        },
        (state) => {
          state.app.current = 'APP_READY'
          state.router.current = 'ROUTER_INITIAL'

          state.clients.current = 'FETCH_CLIENTS_SUCCESS'
          if (state.clients.current === 'FETCH_CLIENTS_SUCCESS') {
            state.clients.clients = []
            state.clients.selectedClient = null
            state.clients.error = null
          }
        }
      )

      renderExample()

      expect(screen.getByTestId('current-route')).toHaveTextContent(
        'Current Pattern: N/A'
      )
      expect(screen.getByTestId('current-params')).toHaveTextContent(
        'Current Params: {}'
      )
      expect(screen.getByTestId('route-params')).toHaveTextContent(
        'Route Params: {}'
      )
    })
  })

  describe('Advanced Usage Patterns', () => {
    test('should handle complex navigation flows', () => {
      renderExample()

      // Navigate to clients
      const clientsButton = screen.getByTestId('nav-clients-object')
      fireEvent.click(clientsButton)

      // Then navigate to specific client
      const clientDetailButton = screen.getByTestId('nav-client-detail')
      fireEvent.click(clientDetailButton)

      // Verify navigation calls were made
      expect(mockHistory.pushState).toHaveBeenCalledTimes(2)
      expect(mockHistory.pushState).toHaveBeenNthCalledWith(
        1,
        {},
        '',
        'http://localhost:3000/clients'
      )
      expect(mockHistory.pushState).toHaveBeenNthCalledWith(
        2,
        {},
        '',
        'http://localhost:3000/clients/123?tab=details'
      )
    })

    test('should handle mixed navigation types in sequence', () => {
      renderExample()

      // String navigation
      const homeButton = screen.getByTestId('nav-home-string')
      fireEvent.click(homeButton)

      // Object navigation
      const clientsButton = screen.getByTestId('nav-clients-object')
      fireEvent.click(clientsButton)

      // URL string navigation
      const urlButton = screen.getByTestId('nav-url-string')
      fireEvent.click(urlButton)

      // Redirect (doesn't use pushState)
      const redirectButton = screen.getByTestId('redirect-new-client')
      fireEvent.click(redirectButton)

      expect(mockHistory.pushState).toHaveBeenCalledTimes(3)
      expect(mockLocation.pathname).toBe('/clients/new') // From redirect
    })
  })
})
