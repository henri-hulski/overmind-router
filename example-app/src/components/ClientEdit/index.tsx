import React, { useEffect, useState } from 'react'

import { useActions, useAppState } from '../../overmind'
import type { ClientT } from '../../overmind/clients/clients.effects'

interface Props {
  clientId: number
}

export const ClientEdit: React.FC<Props> = ({ clientId }) => {
  const { clients } = useAppState()
  const actions = useActions()
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Prospect',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isInitialized, setIsInitialized] = useState(false)

  const isLoading = clients.current === 'FETCH_CLIENTS_IN_PROGRESS'
  const isUpdating = clients.current === 'UPDATE_CLIENT_IN_PROGRESS'
  const client = clients.clients.find((c: ClientT) => c.id === clientId)
  const error = clients.error

  useEffect(() => {
    if (!client && !isLoading) {
      actions.clients.loadClient(clientId)
    }
  }, [clientId, client, isLoading])

  useEffect(() => {
    if (client && !isInitialized) {
      setFormData({
        name: client.name,
        company: client.company,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        status: client.status || 'Active',
      })
      setIsInitialized(true)
    }
  }, [client, isInitialized])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await actions.clients.updateClient({ id: clientId, updates: formData })
  }

  const handleCancel = () => {
    actions.router.navigateTo({
      pattern: '/clients/:id',
      routeParams: { id: clientId.toString() },
    })
  }

  if (isLoading) {
    return <div className="loading">Loading client...</div>
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
        <p>The client you're trying to edit doesn't exist.</p>
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
    <div className="client-form-page">
      <div className="page-header">
        <h1>Edit Client: {client.name}</h1>
        <button onClick={handleCancel} className="btn btn-secondary">
          Cancel
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

      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              disabled={isUpdating}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="company">Company *</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className={errors.company ? 'error' : ''}
              disabled={isUpdating}
            />
            {errors.company && (
              <span className="error-text">{errors.company}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              disabled={isUpdating}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              disabled={isUpdating}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={errors.address ? 'error' : ''}
              disabled={isUpdating}
              rows={3}
            />
            {errors.address && (
              <span className="error-text">{errors.address}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isUpdating}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Prospect">Prospect</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
