import React, { useEffect, useState } from 'react'

import { useActions, useAppState } from '../../overmind'
import type { ClientT } from '../../overmind/clients/clients.effects'

export const ClientList: React.FC = () => {
  const { clients, router } = useAppState()
  const actions = useActions()

  // Safe access to query parameters
  const currentRoute =
    router.current === 'ROUTER_READY' ? router.currentRoute : null
  const [searchTerm, setSearchTerm] = useState(
    currentRoute?.params?.search || ''
  )
  const [currentPage, setCurrentPage] = useState(
    parseInt(currentRoute?.params?.page || '1')
  )

  const isLoading = clients.current === 'FETCH_CLIENTS_IN_PROGRESS'
  const clientsList = clients.clients
  const error = clients.error

  useEffect(() => {
    if (clients.current === 'CLIENTS_INITIAL') {
      actions.clients.loadClients()
    }
  }, [])

  useEffect(() => {
    // Update URL when search or page changes
    const query: Record<string, string> = {}
    if (searchTerm) query.search = searchTerm
    if (currentPage > 1) query.page = currentPage.toString()

    actions.router.navigateTo({
      pattern: '/clients',
      params: query,
    })
  }, [searchTerm, currentPage])

  const filteredClients = clientsList.filter(
    (client: ClientT) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleDeleteClient = async (clientId: number) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      await actions.clients.deleteClient(clientId)
    }
  }

  // Check if user can edit/delete clients
  const canEditClient = () => actions.clients.canEditClient()

  if (isLoading) {
    return <div className="loading">Loading clients...</div>
  }

  return (
    <div className="client-list-page">
      <div className="page-header">
        <h1>Client Management</h1>
        <button
          onClick={() => actions.router.navigateTo({ pattern: '/clients/new' })}
          className="btn btn-primary"
        >
          Add New Client
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
          <button
            onClick={actions.clients.clearError}
            className="btn btn-small"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search clients by name, company, or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <p>No clients found matching "{searchTerm}"</p>
          ) : (
            <p>No clients yet. Add your first client to get started!</p>
          )}
        </div>
      ) : (
        <>
          <div className="clients-grid">
            {paginatedClients.map((client: ClientT) => (
              <div key={client.id} className="client-card">
                <div className="client-header">
                  <h3>{client.name}</h3>
                  <div className="client-actions">
                    <button
                      onClick={() =>
                        actions.router.navigateTo({
                          pattern: '/clients/:id',
                          routeParams: { id: client.id.toString() },
                        })
                      }
                      className="btn btn-small btn-secondary"
                    >
                      View
                    </button>
                    {canEditClient() && (
                      <>
                        <button
                          onClick={() =>
                            actions.router.navigateTo({
                              pattern: '/clients/:id/edit',
                              routeParams: { id: client.id.toString() },
                            })
                          }
                          className="btn btn-small"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="btn btn-small btn-danger"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="client-info">
                  <p className="company">{client.company}</p>
                  <p className="email">{client.email}</p>
                  <p className="phone">{client.phone}</p>
                  <p className="status">Status: {client.status}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-small"
              >
                Previous
              </button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="btn btn-small"
              >
                Next
              </button>
            </div>
          )}

          <div className="results-info">
            Showing {paginatedClients.length} of {filteredClients.length}{' '}
            clients
          </div>
        </>
      )}
    </div>
  )
}
