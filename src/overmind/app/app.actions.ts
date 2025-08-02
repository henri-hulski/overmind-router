import type { Context } from '..'
import { routes } from '../../routes'

export const onInitializeOvermind = async ({ state, actions }: Context) => {
  // Check authentication first
  await actions.auth.checkSession()

  // Initialize the router with our routes configuration
  actions.router.initializeRouter(routes)

  // Set up browser navigation listener for back/forward buttons
  window.addEventListener('popstate', () => {
    actions.router.onPopState()
  })

  // Mark app as initialized
  state.app.send('APP_INITIALIZED')
}
