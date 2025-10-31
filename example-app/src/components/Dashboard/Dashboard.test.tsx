import { fireEvent, render, screen } from '@testing-library/react'
import { createOvermindMock } from 'overmind'
import { Provider } from 'overmind-react'
import type { ParamsT, RouteT } from 'overmind-router'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { config } from '../../overmind'
import { Dashboard } from './index'

// Narrow navigateTo function type for test mocks
type NavigateToFn = (
  pattern: string,
  params?: ParamsT,
  routeParams?: ParamsT
) => void

describe('Dashboard Component', () => {
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

  const renderDashboard = () => {
    return render(
      <Provider value={overmind}>
        <Dashboard />
      </Provider>
    )
  }

  let mockNavigate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockNavigate = vi.fn((pattern: string, params = {}, routeParams = {}) => {
      let path = pattern
      for (const [key, value] of Object.entries(routeParams)) {
        path = path.replace(`:${key}`, String(value))
      }

      let url = 'http://localhost:3000' + path
      if (Object.keys(params).length > 0) {
        const urlParams = new URLSearchParams(params as Record<string, string>)
        url += '?' + urlParams.toString()
      }

      const urlObj = new URL(url)
      mockLocation.pathname = urlObj.pathname
      mockLocation.search = urlObj.search
      mockLocation.href = url

      mockHistory.pushState({}, '', url)
    })

    overmind = createOvermindMock(
      config,
      {
        router: {
          navigateTo: mockNavigate as NavigateToFn,
          redirectTo: () => Promise.resolve(),
          navigateBack: () => Promise.resolve(),
          navigateForward: () => Promise.resolve(),
          parseRoute: (route: RouteT) => {
            if (typeof route === 'string') {
              return {
                pattern: route,
                path: route,
                params: {},
                routeParams: {},
              }
            }
            return {
              pattern: route.pattern || '/',
              path: route.pattern || '/',
              params: route.params || {},
              routeParams: route.routeParams || {},
            }
          },
          validateRoute: () => true,
          getCurrentRoute: () => ({ pattern: '/', path: '/' }),
          getUrlFromRoute: () => '/',
          isValidUrl: () => true,
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
        // Set up app and router state properly
        state.app.current = 'APP_READY'
        state.router.current = 'ROUTER_READY'

        // Set router ready state properties
        if (state.router.current === 'ROUTER_READY') {
          state.router.currentRoute = { pattern: '/', path: '/' }
          state.router.routes = {}
        }

        // Set clients state
        state.clients.current = 'FETCH_CLIENTS_SUCCESS'
        if (state.clients.current === 'FETCH_CLIENTS_SUCCESS') {
          state.clients.clients = [
            {
              id: 1,
              name: 'Client A',
              company: 'Company A',
              email: 'a@example.com',
              phone: '+1-555-0001',
              address: '123 Main St',
              status: 'Active',
              createdAt: '2024-01-01',
            },
            {
              id: 2,
              name: 'Client B',
              company: 'Company B',
              email: 'b@example.com',
              phone: '+1-555-0002',
              address: '456 Oak Ave',
              status: 'Active',
              createdAt: '2024-01-02',
            },
            {
              id: 3,
              name: 'Client C',
              company: 'Company C',
              email: 'c@example.com',
              phone: '+1-555-0003',
              address: '789 Pine St',
              status: 'Prospect',
              createdAt: '2024-01-03',
            },
            {
              id: 4,
              name: 'Client D',
              company: 'Company D',
              email: 'd@example.com',
              phone: '+1-555-0004',
              address: '321 Elm St',
              status: 'Active',
              createdAt: '2024-01-04',
            },
            {
              id: 5,
              name: 'Client E',
              company: 'Company E',
              email: 'e@example.com',
              phone: '+1-555-0005',
              address: '654 Maple Ave',
              status: 'Active',
              createdAt: '2024-01-05',
            },
          ]
          state.clients.selectedClient = null
          state.clients.error = null
        }
      }
    )
  })

  test('should render dashboard with correct title', () => {
    renderDashboard()

    expect(screen.getByText('Client Management Dashboard')).toBeInTheDocument()
  })

  test('should display correct statistics', () => {
    renderDashboard()

    expect(screen.getByText('Total Clients')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Total clients count

    expect(screen.getByText('Active Projects')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // Math.floor(5 * 0.7)

    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
    expect(screen.getByText('$12.500')).toBeInTheDocument() // 5 * 2500 formatted
  })

  test('should display recent clients section', () => {
    renderDashboard()

    expect(screen.getByText('Recent Clients')).toBeInTheDocument()
    // Should show last 3 clients in reverse order (E, D, C)
    expect(screen.getByText('Client E')).toBeInTheDocument()
    expect(screen.getByText('Client D')).toBeInTheDocument()
    expect(screen.getByText('Client C')).toBeInTheDocument()
    // Should not show Client A or B
    expect(screen.queryByText('Client A')).not.toBeInTheDocument()
    expect(screen.queryByText('Client B')).not.toBeInTheDocument()
  })

  test('should navigate to clients list when clicking "View All Clients"', () => {
    renderDashboard()

    const viewAllButton = screen.getByText('View All Clients')
    fireEvent.click(viewAllButton)

    expect(mockNavigate).toHaveBeenCalledWith('/clients', {}, {})
  })

  test('should navigate to add client when clicking "Add New Client"', () => {
    renderDashboard()

    const addClientButton = screen.getByText('Add New Client')
    fireEvent.click(addClientButton)

    expect(mockNavigate).toHaveBeenCalledWith('/clients/new', {}, {})
  })

  test('should navigate to client detail when clicking on a client', () => {
    renderDashboard()

    const viewDetailsButtons = screen.getAllByText('View Details')
    expect(viewDetailsButtons).toHaveLength(3) // Last 3 clients

    // Click on the first "View Details" button (which corresponds to Client E)
    fireEvent.click(viewDetailsButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/clients/:id', {}, { id: '5' })
  })

  test('should handle empty clients list', () => {
    const mockNavigateToEmpty = vi.fn()
    overmind = createOvermindMock(
      config,
      {
        router: { navigateTo: mockNavigateToEmpty },
        clients: { api: { getClients: () => Promise.resolve([]) } },
      },
      (state) => {
        state.app.current = 'APP_READY'
        state.router.current = 'ROUTER_READY'

        if (state.router.current === 'ROUTER_READY') {
          state.router.currentRoute = { pattern: '/', path: '/' }
        }

        state.clients.current = 'FETCH_CLIENTS_SUCCESS'
        if (state.clients.current === 'FETCH_CLIENTS_SUCCESS') {
          state.clients.clients = []
          state.clients.selectedClient = null
          state.clients.error = null
        }
      }
    )

    renderDashboard()

    // Use more specific selectors to avoid ambiguity with multiple "0" elements
    const totalClientsCard = screen
      .getByText('Total Clients')
      .closest('.stat-card')
    expect(totalClientsCard?.querySelector('.stat-number')).toHaveTextContent(
      '0'
    )
    expect(screen.getByText('$0')).toBeInTheDocument() // Revenue
    expect(
      screen.getByText('No clients yet. Add your first client to get started!')
    ).toBeInTheDocument()
  })

  test('should handle single client', () => {
    const mockNavigateToSingle = vi.fn()
    overmind = createOvermindMock(
      config,
      {
        router: { navigateTo: mockNavigateToSingle },
        clients: { api: { getClients: () => Promise.resolve([]) } },
      },
      (state) => {
        state.app.current = 'APP_READY'
        state.router.current = 'ROUTER_READY'

        if (state.router.current === 'ROUTER_READY') {
          state.router.currentRoute = { pattern: '/', path: '/' }
        }

        state.clients.current = 'FETCH_CLIENTS_SUCCESS'
        if (state.clients.current === 'FETCH_CLIENTS_SUCCESS') {
          state.clients.clients = [
            {
              id: 1,
              name: 'Single Client',
              company: 'Single Company',
              email: 'single@example.com',
              phone: '+1-555-9999',
              address: '999 Single St',
              status: 'Active',
              createdAt: '2024-01-01',
            },
          ]
          state.clients.selectedClient = null
          state.clients.error = null
        }
      }
    )

    renderDashboard()

    const totalClientsCard = screen
      .getByText('Total Clients')
      .closest('.stat-card')
    expect(totalClientsCard?.querySelector('.stat-number')).toHaveTextContent(
      '1'
    )
    const activeProjectsCard = screen
      .getByText('Active Projects')
      .closest('.stat-card')
    expect(activeProjectsCard?.querySelector('.stat-number')).toHaveTextContent(
      '0'
    ) // Math.floor(1 * 0.7) = 0
    expect(screen.getByText('$2.500')).toBeInTheDocument() // 1 * 2500
    expect(screen.getByText('Single Client')).toBeInTheDocument()
  })

  test('should display quick actions section', () => {
    renderDashboard()

    // Update to match actual component structure - no "Quick Actions" heading
    expect(screen.getByText('Add New Client')).toBeInTheDocument()
    expect(screen.getByText('View All Clients')).toBeInTheDocument()
    expect(screen.getByText('Manage Clients')).toBeInTheDocument()
  })

  test('should have correct CSS classes for styling', () => {
    renderDashboard()

    const dashboard = screen
      .getByText('Client Management Dashboard')
      .closest('.dashboard')
    expect(dashboard).toBeInTheDocument()

    const statsGrid = screen.getByText('Total Clients').closest('.stats-grid')
    expect(statsGrid).toBeInTheDocument()

    const statCards = screen.getAllByText(
      /Total Clients|Active Projects|Monthly Revenue/
    )
    statCards.forEach((card) => {
      const statCard = card.closest('.stat-card')
      expect(statCard).toBeInTheDocument()
    })
  })
})
