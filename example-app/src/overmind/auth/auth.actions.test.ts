import { createOvermindMock } from 'overmind'
import { describe, expect, test, vi } from 'vitest'

import { config } from '../index'

describe('auth actions', () => {
  test('should handle checkSession when called from onInitializeOvermind', async () => {
    // Create a mock overmind instance
    const app = createOvermindMock(config, {
      auth: {
        getCurrentUser: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }),
      },
    })

    // Simulate the initialization flow that causes the error
    await app.actions.auth.checkSession()
    
    // Should not throw an error and should transition to AUTHENTICATED state
    expect(app.state.auth.current).toBe('AUTHENTICATED')
  })

  test('should handle checkSession when user is authenticated', async () => {
    // Create a mock overmind instance with initial authenticated state
    const app = createOvermindMock(config, {
      auth: {
        getCurrentUser: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }),
      },
    }, (state) => {
      // Set initial state to simulate existing session
      state.auth.current = 'UNAUTHENTICATED'
      if (state.auth.current === 'UNAUTHENTICATED') {
        state.auth.credentials = { email: '', password: '' }
      }
    })

    await app.actions.auth.checkSession()
    
    // Should transition to SESSION_CHECK_IN_PROGRESS then back to AUTHENTICATED
    expect(app.state.auth.current).toBe('AUTHENTICATED')
  })

  test('should handle checkSession when no user is found', async () => {
    // Create a mock overmind instance with no user
    const app = createOvermindMock(config, {
      auth: {
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    }, (state) => {
      state.auth.current = 'UNAUTHENTICATED'
      if (state.auth.current === 'UNAUTHENTICATED') {
        state.auth.credentials = { email: '', password: '' }
      }
    })

    await app.actions.auth.checkSession()
    
    // Should transition to SESSION_CHECK_IN_PROGRESS then back to UNAUTHENTICATED
    expect(app.state.auth.current).toBe('UNAUTHENTICATED')
  })
})