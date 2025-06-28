import { describe, expect, test } from 'vitest'

import type { RouteConfigT } from './overmind/router/router.effects'
import { routes } from './routes'

describe('Routes Configuration', () => {
  test('should export routes object', () => {
    expect(routes).toBeDefined()
    expect(typeof routes).toBe('object')
  })

  test('should contain all expected route patterns', () => {
    const expectedRoutes = [
      '/',
      '/clients',
      '/clients/new',
      '/clients/:id',
      '/clients/:id/edit',
    ]

    expectedRoutes.forEach((route) => {
      expect(routes).toHaveProperty(route)
    })
  })

  test('should have correct parameter configuration for each route', () => {
    expect(routes['/']).toEqual({ params: [] })
    expect(routes['/clients']).toEqual({ params: ['search', 'page'] })
    expect(routes['/clients/new']).toEqual({ params: [] })
    expect(routes['/clients/:id']).toEqual({ params: ['tab'] })
    expect(routes['/clients/:id/edit']).toEqual({ params: [] })
  })

  test('should have proper structure for route configurations', () => {
    Object.entries(routes).forEach(([pattern, config]) => {
      expect(typeof pattern).toBe('string')
      expect(config).toHaveProperty('params')
      expect(Array.isArray(config.params)).toBe(true)

      // Type guard to ensure params exists
      if (config.params) {
        config.params.forEach((param) => {
          expect(typeof param).toBe('string')
        })
      }
    })
  })

  test('should include routes with route parameters', () => {
    const routesWithParams = Object.keys(routes).filter((route) =>
      route.includes(':')
    )
    expect(routesWithParams).toContain('/clients/:id')
    expect(routesWithParams).toContain('/clients/:id/edit')
  })

  test('should include routes with query parameters', () => {
    const routesWithQueryParams = Object.entries(routes)
      .filter(([, config]) => config.params && config.params.length > 0)
      .map(([pattern]) => pattern)

    expect(routesWithQueryParams).toContain('/clients')
    expect(routesWithQueryParams).toContain('/clients/:id')
  })

  test('should have logical parameter names', () => {
    expect(routes['/clients'].params).toContain('search')
    expect(routes['/clients'].params).toContain('page')
    expect(routes['/clients/:id'].params).toContain('tab')
  })

  test('should not have duplicate route patterns', () => {
    const patterns = Object.keys(routes)
    const uniquePatterns = [...new Set(patterns)]
    expect(patterns.length).toBe(uniquePatterns.length)
  })

  test('should have consistent route hierarchy', () => {
    const patterns = Object.keys(routes)

    // Base routes should exist
    expect(patterns).toContain('/')
    expect(patterns).toContain('/clients')

    // Child routes should have their parent
    if (patterns.includes('/clients/:id')) {
      expect(patterns).toContain('/clients')
    }

    if (patterns.includes('/clients/:id/edit')) {
      expect(patterns).toContain('/clients/:id')
    }

    if (patterns.includes('/clients/new')) {
      expect(patterns).toContain('/clients')
    }
  })

  describe('Route Pattern Validation', () => {
    test('should have valid route patterns', () => {
      Object.keys(routes).forEach((pattern) => {
        // Should start with /
        expect(pattern).toMatch(/^\//)

        // Should not end with / unless it's the root route
        if (pattern !== '/') {
          expect(pattern).not.toMatch(/\/$/)
        }

        // Should not have double slashes
        expect(pattern).not.toMatch(/\/\//)

        // Parameter patterns should be valid
        const paramMatches = pattern.match(/:[\w]+/g)
        if (paramMatches) {
          paramMatches.forEach((param) => {
            expect(param).toMatch(/^:[a-zA-Z_][a-zA-Z0-9_]*$/)
          })
        }
      })
    })

    test('should have meaningful route patterns', () => {
      Object.keys(routes).forEach((pattern) => {
        // Should contain only valid URL characters
        expect(pattern).toMatch(/^[/a-zA-Z0-9:_-]+$/)

        // Should be descriptive
        if (pattern !== '/') {
          expect(pattern.length).toBeGreaterThan(1)
        }
      })
    })
  })

  describe('Parameter Configuration Validation', () => {
    test('should have reasonable parameter names', () => {
      Object.values(routes).forEach((config: RouteConfigT) => {
        // Type guard to ensure params exists
        if (config.params) {
          config.params.forEach((param) => {
            // Should be lowercase
            expect(param).toMatch(/^[a-z][a-zA-Z0-9]*$/)

            // Should be meaningful
            expect(param.length).toBeGreaterThan(0)
            expect(param).not.toBe('param')
            expect(param).not.toBe('query')
          })
        }
      })
    })

    test('should not have duplicate parameter names within a route', () => {
      Object.values(routes).forEach((config: RouteConfigT) => {
        // Type guard to ensure params exists
        if (config.params) {
          const uniqueParams = [...new Set(config.params)]
          expect(config.params.length).toBe(uniqueParams.length)
        }
      })
    })
  })

  describe('Route Coverage', () => {
    test('should cover main application sections', () => {
      const patterns = Object.keys(routes)

      // Should have dashboard/home
      expect(patterns).toContain('/')

      // Should have main entity routes
      expect(patterns.some((p) => p.includes('clients'))).toBe(true)

      // Should have CRUD operations
      expect(patterns.some((p) => p.includes('new'))).toBe(true)
      expect(patterns.some((p) => p.includes('edit'))).toBe(true)
      expect(patterns.some((p) => p.includes(':id'))).toBe(true)
    })

    test('should support common navigation patterns', () => {
      const patterns = Object.keys(routes)

      // List view
      expect(patterns).toContain('/clients')

      // Detail view
      expect(patterns).toContain('/clients/:id')

      // Create form
      expect(patterns).toContain('/clients/new')

      // Edit form
      expect(patterns).toContain('/clients/:id/edit')
    })
  })

  describe('Type Safety', () => {
    test('should be properly typed', () => {
      // This test ensures the routes object conforms to the RoutesT type
      // If there are type errors, TypeScript compilation will fail

      const routeEntries = Object.entries(routes)
      expect(routeEntries.length).toBeGreaterThan(0)

      routeEntries.forEach(([pattern, config]) => {
        expect(typeof pattern).toBe('string')
        expect(config).toHaveProperty('params')
        expect(Array.isArray(config.params)).toBe(true)
      })
    })
  })
})
