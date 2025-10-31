import React from 'react'

import { useAppState } from '../../overmind'

export function Admin() {
  const { auth } = useAppState()

  const currentUser = auth.current === 'AUTHENTICATED' ? auth.user : null

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>
      <p>Welcome to the admin area, {currentUser?.name}!</p>

      <div className="admin-content">
        <div className="admin-section">
          <h2>User Management</h2>
          <p>Manage system users and their permissions.</p>
          <button className="btn-secondary">Manage Users</button>
        </div>

        <div className="admin-section">
          <h2>System Settings</h2>
          <p>Configure application settings and preferences.</p>
          <button className="btn-secondary">System Settings</button>
        </div>

        <div className="admin-section">
          <h2>Reports</h2>
          <p>View system reports and analytics.</p>
          <button className="btn-secondary">View Reports</button>
        </div>

        <div className="admin-section">
          <h2>Audit Log</h2>
          <p>Review system activities and user actions.</p>
          <button className="btn-secondary">View Audit Log</button>
        </div>
      </div>
    </div>
  )
}
