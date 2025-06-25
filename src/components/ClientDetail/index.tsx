import React, { useEffect, useState } from 'react'

import { useActions, useAppState } from '../../overmind'
import type { ClientT } from '../../overmind/clients/clients.effects'

interface Props {
  clientId: number
}

export const ClientDetail: React.FC<Props> = ({ clientId }) => {
  const { clients, router } = useAppState()
  const actions = useActions()

  // Safe access to query parameters
  const currentRoute =
    router.current === 'ROUTER_READY' ? router.currentRoute : null
  const [activeTab, setActiveTab] = useState(
    currentRoute?.params?.tab || 'overview'
  )

  const isLoading = clients.current === 'FETCH_CLIENTS_IN_PROGRESS'
  const client = clients.clients.find((c: ClientT) => c.id === clientId)
  const error = clients.error

  useEffect(() => {
    if (!client && clients.current !== 'FETCH_CLIENTS_IN_PROGRESS') {
      actions.clients.loadClient(clientId)
    }
  }, [clientId])

  useEffect(() => {
    // Update URL when tab changes
    const queryParams: Record<string, string> = {}
    if (activeTab !== 'overview') {
      queryParams.tab = activeTab
    }
    actions.router.navigateTo({
      pattern: '/clients/:id',
      routeParams: { id: clientId.toString() },
      params: queryParams,
    })
  }, [activeTab, clientId])

  const handleDeleteClient = async () => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      await actions.clients.deleteClient(clientId)
    }
  }

  if (isLoading) {
    return <div className="loading">Loading client details...</div>
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Error Loading Client</h2>
        <p>{error}</p>
        <button
          onClick={() => actions.router.navigateTo({ pattern: '/clients' })}
          className="btn btn-secondary"
        >
          Back to Clients
        </button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="error-page">
        <h2>Client Not Found</h2>
        <p>The client you're looking for doesn't exist.</p>
        <button
          onClick={() => actions.router.navigateTo({ pattern: '/clients' })}
          className="btn btn-secondary"
        >
          Back to Clients
        </button>
      </div>
    )
  }

  return (
    <div className="client-detail-page">
      <div className="page-header">
        <div className="header-content">
          <button
            onClick={() => actions.router.navigateTo({ pattern: '/clients' })}
            className="btn btn-secondary back-btn"
          >
            ← Back to Clients
          </button>
          <h1>{client.name}</h1>
        </div>
        <div className="header-actions">
          <button
            onClick={() =>
              actions.router.navigateTo({
                pattern: '/clients/:id/edit',
                routeParams: { id: clientId.toString() },
              })
            }
            className="btn btn-primary"
          >
            Edit Client
          </button>
          <button onClick={handleDeleteClient} className="btn btn-danger">
            Delete Client
          </button>
        </div>
      </div>

      <div className="client-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`tab-button ${activeTab === 'billing' ? 'active' : ''}`}
        >
          Billing
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
        >
          Notes
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="client-info-grid">
              <div className="info-section">
                <h3>Contact Information</h3>
                <div className="info-item">
                  <label>Name:</label>
                  <span>{client.name}</span>
                </div>
                <div className="info-item">
                  <label>Company:</label>
                  <span>{client.company}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{client.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{client.phone}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span
                    className={`status status-${client.status.toLowerCase()}`}
                  >
                    {client.status}
                  </span>
                </div>
              </div>

              <div className="info-section">
                <h3>Address</h3>
                <div className="address">{client.address}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-tab">
            <h3>Projects</h3>
            <div className="projects-list">
              <div className="project-item">
                <h4>Website Redesign</h4>
                <p>Status: In Progress</p>
                <p>Budget: $25,000</p>
              </div>
              <div className="project-item">
                <h4>Mobile App Development</h4>
                <p>Status: Planning</p>
                <p>Budget: $45,000</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="billing-tab">
            <h3>Billing Information</h3>
            <div className="billing-summary">
              <div className="billing-item">
                <label>Total Billed:</label>
                <span>$12,500</span>
              </div>
              <div className="billing-item">
                <label>Outstanding:</label>
                <span>$3,200</span>
              </div>
              <div className="billing-item">
                <label>Payment Terms:</label>
                <span>Net 30</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-tab">
            <h3>Client Notes</h3>
            <div className="notes-content">
              <p>• Prefers morning meetings</p>
              <p>• Very detail-oriented, likes frequent updates</p>
              <p>• Budget-conscious but values quality</p>
              <p>• Decision maker for all technical aspects</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
