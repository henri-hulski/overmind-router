import type { Context } from '../index'
import type { CredentialsT } from './auth.state'

export const login = async (
  { state, effects, actions }: Context,
  _payload: { email: string; password: string }
) => {
  if (
    state.auth
      .send('USER_SIGN_IN_REQUESTED')
      .matches('AUTHENTICATION_IN_PROGRESS')
  ) {
    if (state.auth.current !== 'AUTHENTICATION_IN_PROGRESS') return

    const { credentials } = state.auth

    try {
      const user = await effects.auth.authenticateUser(
        credentials.email,
        credentials.password
      )

      if (user) {
        // Persist for demo
        localStorage.setItem('currentUser', JSON.stringify(user))

        state.auth.send('USER_SIGN_IN_RESOLVED', { user })

        // Redirect to intended page or dashboard
        const currentRoute = state.router.matches('ROUTER_READY')?.currentRoute
        const returnUrl = currentRoute?.params?.returnUrl || '/'

        // Use setTimeout to allow state to update before navigation
        setTimeout(() => {
          if (returnUrl && returnUrl !== '/login') {
            actions.router.navigateTo(returnUrl)
          } else {
            actions.router.navigateTo('/')
          }
        }, 100)
      } else {
        state.auth.send('USER_SIGN_IN_REJECTED', {
          errorMsg: 'Invalid email or password',
          errorType: 'authentication_failed',
        })
      }
    } catch (_error) {
      state.auth.send('USER_SIGN_IN_REJECTED', {
        errorMsg: 'Login failed. Please try again.',
        errorType: 'network_error',
      })
    }
  }
}

export const logout = async ({ state, effects, actions }: Context) => {
  await effects.auth.logout()
  state.auth.send('USER_SIGNED_OUT')
  actions.router.navigateTo('/')
}

export const checkSession = async ({ state, effects }: Context) => {
  if (
    state.auth
      .send('SESSION_CHECK_REQUESTED')
      .matches('SESSION_CHECK_IN_PROGRESS')
  ) {
    try {
      const user = await effects.auth.getCurrentUser()
      if (user) {
        state.auth.send('SESSION_CHECK_RESOLVED', { user })
      } else {
        state.auth.send('SESSION_CHECK_FAILED')
      }
    } catch (_error) {
      state.auth.send('SESSION_CHECK_FAILED')
    }
  }
}

export const changeCredentials = (
  { state }: Context,
  {
    newValue,
    credentialType,
  }: {
    newValue: string
    credentialType: keyof CredentialsT
  }
) => {
  if (credentialType === 'email') {
    state.auth.send('EMAIL_CHANGED', { email: newValue })
  }

  if (credentialType === 'password') {
    state.auth.send('PASSWORD_CHANGED', { password: newValue })
  }
}
