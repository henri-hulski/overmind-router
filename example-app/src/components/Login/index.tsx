import React, { useState } from 'react'

import { useActions, useAppState } from '../../overmind'

export function Login() {
  const { auth } = useAppState()
  const actions = useActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Set credentials first, then trigger login
    actions.auth.changeCredentials({ newValue: email, credentialType: 'email' })
    actions.auth.changeCredentials({
      newValue: password,
      credentialType: 'password',
    })
    actions.auth.login({ email, password })
  }

  const isLoading = auth.current === 'AUTHENTICATION_IN_PROGRESS'
  const errorMessage =
    auth.current === 'AUTHENTICATION_FAILURE' ? auth.errorMsg : null

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>
        <p className="login-subtitle">Client Management System</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your password"
            />
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary login-button"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-users">
          <h3>Demo Users:</h3>
          <ul>
            <li>
              <strong>admin@example.com</strong> - Admin user (full access)
            </li>
            <li>
              <strong>manager@example.com</strong> - Manager user (can
              create/edit clients)
            </li>
            <li>
              <strong>user@example.com</strong> - Regular user (view only)
            </li>
          </ul>
          <p>
            <em>Use any password</em>
          </p>
        </div>
      </div>
    </div>
  )
}
