import React, { useEffect } from 'react'

import { useActions, useAppState } from '../../overmind'
import { ClientDetail } from '../ClientDetail'
import { ClientEdit } from '../ClientEdit'
import { ClientList } from '../ClientList'
import { ClientNew } from '../ClientNew'
import { Dashboard } from '../Dashboard'

export default function App() {
  const { router, app } = useAppState()
  const actions = useActions()

  useEffect(() => {
    if (app.current === 'APP_INITIAL') {
      actions.app.onInitializeOvermind()
    }
  }, [app.current, actions.app])

  // Show loading state while app is initializing
  if (app.current === 'APP_INITIAL' || router.current === 'ROUTER_INITIAL') {
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

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h1
            onClick={() => actions.router.navigateTo({ pattern: '/' })}
            style={{ cursor: 'pointer' }}
          >
            Client Manager
          </h1>
        </div>
        <div className="nav-links">
          <button
            onClick={() => actions.router.navigateTo({ pattern: '/' })}
            className={`nav-link ${pattern === '/' ? 'active' : ''}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              actions.router.navigateTo({ pattern: '/clients' })
            }}
            className={`nav-link ${pattern === '/clients' ? 'active' : ''}`}
          >
            Clients
          </button>
          <button
            onClick={() =>
              actions.router.navigateTo({ pattern: '/clients/new' })
            }
            className={`nav-link ${pattern === '/clients/new' ? 'active' : ''}`}
          >
            Add Client
          </button>
        </div>
      </nav>

      <main className="main-content">
        {pattern === '/' && <Dashboard />}
        {pattern === '/clients' && <ClientList />}
        {pattern === '/clients/new' && <ClientNew />}
        {pattern === '/clients/:id' && routeParams?.id && (
          <ClientDetail clientId={parseInt(routeParams.id)} />
        )}
        {pattern === '/clients/:id/edit' && routeParams?.id && (
          <ClientEdit clientId={parseInt(routeParams.id)} />
        )}
      </main>
    </div>
  )
}
