import type { Context } from '..'
import type { ClientT, PostClientT } from './clients.effects'

export const loadClients = async ({ state, effects }: Context) => {
  state.clients.send('FETCH_CLIENTS_REQUESTED')

  try {
    const clients = await effects.clients.api.getClients()
    state.clients.send('FETCH_CLIENTS_RESOLVED', { clients })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load clients'
    state.clients.send('FETCH_CLIENTS_REJECTED', { error: errorMessage })
  }
}

export const loadClient = async (context: Context, clientId: number) => {
  const { state } = context
  // First check if we already have the client in state
  const existingClient = state.clients.clients.find(
    (c: ClientT) => c.id === clientId
  )
  if (existingClient) {
    state.clients.send('CLIENT_SELECTED', { client: existingClient })
    return existingClient
  }

  // If not in state, load all clients (in a real app, you'd fetch individual client)
  if (state.clients.current === 'CLIENTS_INITIAL') {
    await loadClients(context)
  }

  const client = state.clients.clients.find((c: ClientT) => c.id === clientId)
  state.clients.send('CLIENT_SELECTED', { client: client || null })
  return client
}

export const createClient = async (
  { state, effects, actions }: Context,
  clientData: PostClientT
) => {
  state.clients.send('CREATE_CLIENT_REQUESTED')

  try {
    const newClient = await effects.clients.api.createClient(clientData)
    state.clients.send('CREATE_CLIENT_RESOLVED', { client: newClient })

    // Navigate to the new client detail page
    actions.router.navigateTo({
      pattern: '/clients/:id',
      routeParams: { id: newClient.id.toString() },
    })

    return newClient
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create client'
    state.clients.send('CREATE_CLIENT_REJECTED', { error: errorMessage })
    throw error
  }
}

export const updateClient = async (
  { state, effects, actions }: Context,
  payload: { id: number; updates: Partial<PostClientT> }
) => {
  state.clients.send('UPDATE_CLIENT_REQUESTED')

  try {
    const updatedClient = await effects.clients.api.updateClient(
      payload.id,
      payload.updates
    )
    state.clients.send('UPDATE_CLIENT_RESOLVED', { client: updatedClient })

    actions.router.navigateTo({
      pattern: '/clients/:id',
      routeParams: { id: updatedClient.id.toString() },
    })

    return updatedClient
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update client'
    state.clients.send('UPDATE_CLIENT_REJECTED', { error: errorMessage })
    throw error
  }
}

export const canEditClient = ({ state, actions }: Context): boolean => {
  const currentUser =
    state.auth.current === 'AUTHENTICATED' ? state.auth.user : null
  const editRouteConfig = state.router.routes['/clients/:id/edit']

  if (!editRouteConfig) return false

  const result = actions.router.checkRouteAccess({
    routeConfig: editRouteConfig,
    user: currentUser,
  })

  return result.allowed
}

export const deleteClient = async (
  { state, effects, actions }: Context,
  clientId: number
) => {
  // Check permissions before attempting to delete
  if (!actions.clients.canEditClient()) {
    const errorMessage = 'You do not have permission to delete clients'
    state.clients.send('DELETE_CLIENT_REJECTED', { error: errorMessage })
    throw new Error(errorMessage)
  }

  state.clients.send('DELETE_CLIENT_REQUESTED')

  try {
    await effects.clients.api.deleteClient(clientId)
    state.clients.send('DELETE_CLIENT_RESOLVED', { clientId })

    // Navigate back to clients list
    actions.router.navigateTo({ pattern: '/clients' })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete client'
    state.clients.send('DELETE_CLIENT_REJECTED', { error: errorMessage })
    throw error
  }
}

export const clearError = ({ state }: Context) => {
  state.clients.send('ERROR_CLEARED')
}
