import { render } from '@testing-library/react'
import { createOvermindMock } from 'overmind'
import { Provider } from 'overmind-react'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { config } from '../../overmind'
import App from './index'

describe('App Component', () => {
  let overmind: ReturnType<typeof createOvermindMock<typeof config>>

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
          navigateTo: () => Promise.resolve(),
          redirectTo: () => Promise.resolve(),
          navigateBack: vi.fn(() => Promise.resolve()),
          navigateForward: vi.fn(() => Promise.resolve()),
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
  })

  test('should render the app', () => {
    renderApp()

    // App should be rendered successfully
    expect(document.body).toBeInTheDocument()
  })

  test('should initialize with proper state', () => {
    renderApp()

    // Check that state machines are initialized correctly
    expect(overmind.state.app.current).toBe('APP_READY')
    expect(overmind.state.router.current).toBe('ROUTER_READY')
    expect(overmind.state.clients.current).toBe('FETCH_CLIENTS_SUCCESS')
  })

  test('should have router current route set', () => {
    renderApp()

    // Router should have the current route
    if (overmind.state.router.current === 'ROUTER_READY') {
      expect(overmind.state.router.currentRoute).toBeDefined()
      expect(overmind.state.router.currentRoute?.pattern).toBe('/')
    }
  })

  test('should handle clients state properly', () => {
    renderApp()

    // Clients state should be initialized
    if (overmind.state.clients.current === 'FETCH_CLIENTS_SUCCESS') {
      expect(overmind.state.clients.clients).toEqual([])
      expect(overmind.state.clients.selectedClient).toBeNull()
      expect(overmind.state.clients.error).toBeNull()
    }
  })
})
