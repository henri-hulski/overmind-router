import React from 'react'

import { useActions, useAppState } from '../../overmind'

export const Dashboard: React.FC = () => {
  const { clients } = useAppState()
  const actions = useActions()

  const totalClients = clients.clients.length
  const recentClients = clients.clients.slice(-3).reverse()

  const handleNavigateToClients = () => {
    actions.router.navigateTo({ pattern: '/clients' })
  }

  const handleNavigateToAddClient = () => {
    actions.router.navigateTo({ pattern: '/clients/new' })
  }

  return (
    <div className="dashboard">
      <h1>Client Management Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Clients</h3>
          <div className="stat-number">{totalClients}</div>
        </div>

        <div className="stat-card">
          <h3>Active Projects</h3>
          <div className="stat-number">{Math.floor(totalClients * 0.7)}</div>
        </div>

        <div className="stat-card">
          <h3>Monthly Revenue</h3>
          <div className="stat-number">
            ${(totalClients * 2500).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Clients</h2>
          <button
            onClick={handleNavigateToClients}
            className="btn btn-secondary"
          >
            View All Clients
          </button>
        </div>

        {recentClients.length > 0 ? (
          <div className="client-list">
            {recentClients.map((client) => (
              <div key={client.id} className="client-item">
                <div className="client-info">
                  <h4>{client.name}</h4>
                  <p>{client.company}</p>
                  <span className="client-email">{client.email}</span>
                </div>
                <button
                  onClick={() =>
                    actions.router.navigateTo({
                      pattern: '/clients/:id',
                      routeParams: { id: client.id.toString() },
                    })
                  }
                  className="btn btn-small"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No clients yet. Add your first client to get started!</p>
          </div>
        )}
      </div>

      <div className="dashboard-actions">
        <button onClick={handleNavigateToAddClient} className="btn btn-primary">
          Add New Client
        </button>
        <button onClick={handleNavigateToClients} className="btn btn-secondary">
          Manage Clients
        </button>
      </div>
    </div>
  )
}
