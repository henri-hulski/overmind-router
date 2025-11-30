import React, { useEffect } from 'react'

import { useActions, useAppState } from '../../overmind'
import { routes } from '../../routes'
import { Admin } from '../Admin'
import { ClientDetail } from '../ClientDetail'
import { ClientEdit } from '../ClientEdit'
import { ClientList } from '../ClientList'
import { ClientNew } from '../ClientNew'
import { Dashboard } from '../Dashboard'
import { Login } from '../Login'

export default function App() {
  const { router, app, auth } = useAppState()
  const actions = useActions()

  useEffect(() => {
    if (app.current === 'APP_INITIAL') {
      actions.app.onInitializeOvermind()
    }
  }, [app.current, actions.app])

  // Helper to check if user can access a route
  const canAccess = (routePattern: string) => {
    const routeConfig = routes[routePattern]
    if (!routeConfig) return false

    const currentUser = auth.current === 'AUTHENTICATED' ? auth.user : null

    const result = actions.router.checkRouteAccess({
      routeConfig,
      user: currentUser,
    })
    return result.allowed
  }

  // Show loading state while app is initializing
  if (
    app.current === 'APP_INITIAL' ||
    router.current === 'ROUTER_INITIAL' ||
    auth.current === 'SESSION_CHECK_IN_PROGRESS'
  ) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Initializing application...</p>
      </div>
    )
  }

  // Handle router error states
  if (router.current === 'ROUTE_NOT_FOUND') {
    return (
      <div className="app">
        <div className="error-page">
          <h1>Page Not Found</h1>
          <p>The requested path "{router.requestedPath}" was not found.</p>
          <button
            onClick={() => actions.router.navigateTo({ pattern: '/' })}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (router.current === 'NAVIGATION_FAILURE') {
    return (
      <div className="app">
        <div className="error-page">
          <h1>Navigation Error</h1>
          <p>{router.errorMsg}</p>
          <button
            onClick={() => actions.router.navigateTo({ pattern: '/' })}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (router.current !== 'ROUTER_READY' || !router.currentRoute) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  const { pattern, routeParams } = router.currentRoute

  // Check route access for protected routes
  const routeConfig = routes[pattern]
  if (routeConfig) {
    const currentUser = auth.current === 'AUTHENTICATED' ? auth.user : null

    const accessResult = actions.router.checkRouteAccess({
      routeConfig,
      user: currentUser,
    })

    if (!accessResult.allowed) {
      if (accessResult.reason === 'authentication') {
        // Redirect to login if not authenticated
        if (pattern !== '/login') {
          actions.router.navigateTo({
            pattern: '/login',
            params: { returnUrl: window.location.pathname },
          })
          return null
        }
      } else {
        // Show unauthorized page for authorization failures
        return (
          <div className="app">
            <div className="error-page">
              <h1>Access Denied</h1>
              <p>{accessResult.message}</p>
              <button
                onClick={() => actions.router.navigateTo('/')}
                className="btn-primary"
              >
                Go Home
              </button>
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div className="app">
      {auth.current === 'AUTHENTICATED' && (
        <nav className="navbar">
          <div className="nav-brand">
            <h1
              onClick={() => actions.router.navigateTo('/')}
              style={{ cursor: 'pointer' }}
            >
              Client Manager
            </h1>
          </div>
          <div className="nav-links">
            <button
              onClick={() => actions.router.navigateTo('/')}
              className={`nav-link ${pattern === '/' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => actions.router.navigateTo('/clients')}
              className={`nav-link ${pattern === '/clients' ? 'active' : ''}`}
            >
              Clients
            </button>
            {canAccess('/clients/new') && (
              <button
                onClick={() => actions.router.navigateTo('/clients/new')}
                className={`nav-link ${pattern === '/clients/new' ? 'active' : ''}`}
              >
                Add Client
              </button>
            )}
            {canAccess('/admin') && (
              <button
                onClick={() => actions.router.navigateTo('/admin')}
                className={`nav-link ${pattern === '/admin' ? 'active' : ''}`}
              >
                Admin
              </button>
            )}
          </div>
          <div className="nav-user">
            <span>Welcome, {auth.user.name}</span>
            <button
              onClick={() => actions.auth.logout()}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      <main className="main-content">
        {pattern === '/' && <Dashboard />}
        {pattern === '/login' && <Login />}
        {pattern === '/clients' && <ClientList />}
        {pattern === '/clients/new' && <ClientNew />}
        {pattern === '/clients/:id' && routeParams?.id && (
          <ClientDetail clientId={parseInt(routeParams.id)} />
        )}
        {pattern === '/clients/:id/edit' && routeParams?.id && (
          <ClientEdit clientId={parseInt(routeParams.id)} />
        )}
        {pattern === '/admin' && <Admin />}
      </main>
    </div>
  )
}
