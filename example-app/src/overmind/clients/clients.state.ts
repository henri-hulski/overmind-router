import { statemachine } from 'overmind'

import type { ClientT } from './clients.effects'

type BaseState = {
  clients: ClientT[]
  selectedClient: ClientT | null
  error: string | null
}

type States =
  | { current: 'CLIENTS_INITIAL' }
  | { current: 'FETCH_CLIENTS_IN_PROGRESS' }
  | { current: 'FETCH_CLIENTS_SUCCESS' }
  | { current: 'CREATE_CLIENT_IN_PROGRESS' }
  | { current: 'UPDATE_CLIENT_IN_PROGRESS' }
  | { current: 'DELETE_CLIENT_IN_PROGRESS' }
  | { current: 'CLIENTS_FAILURE' }

type Events =
  | { type: 'FETCH_CLIENTS_REQUESTED' }
  | { type: 'FETCH_CLIENTS_RESOLVED'; data: { clients: ClientT[] } }
  | { type: 'FETCH_CLIENTS_REJECTED'; data: { error: string } }
  | { type: 'CREATE_CLIENT_REQUESTED' }
  | { type: 'CREATE_CLIENT_RESOLVED'; data: { client: ClientT } }
  | { type: 'CREATE_CLIENT_REJECTED'; data: { error: string } }
  | { type: 'UPDATE_CLIENT_REQUESTED' }
  | { type: 'UPDATE_CLIENT_RESOLVED'; data: { client: ClientT } }
  | { type: 'UPDATE_CLIENT_REJECTED'; data: { error: string } }
  | { type: 'DELETE_CLIENT_REQUESTED' }
  | { type: 'DELETE_CLIENT_RESOLVED'; data: { clientId: number } }
  | { type: 'DELETE_CLIENT_REJECTED'; data: { error: string } }
  | { type: 'CLIENT_SELECTED'; data: { client: ClientT | null } }
  | { type: 'ERROR_CLEARED' }

const clientsMachine = statemachine<States, Events, BaseState>({
  CLIENTS_INITIAL: {
    FETCH_CLIENTS_REQUESTED: () => ({ current: 'FETCH_CLIENTS_IN_PROGRESS' }),
  },

  FETCH_CLIENTS_IN_PROGRESS: {
    FETCH_CLIENTS_RESOLVED: ({ clients }, state) => {
      state.clients = clients
      state.error = null
      return { current: 'FETCH_CLIENTS_SUCCESS' }
    },
    FETCH_CLIENTS_REJECTED: ({ error }, state) => {
      state.error = error
      return { current: 'CLIENTS_FAILURE' }
    },
  },

  FETCH_CLIENTS_SUCCESS: {
    FETCH_CLIENTS_REQUESTED: () => ({ current: 'FETCH_CLIENTS_IN_PROGRESS' }),
    CREATE_CLIENT_REQUESTED: () => ({ current: 'CREATE_CLIENT_IN_PROGRESS' }),
    UPDATE_CLIENT_REQUESTED: () => ({ current: 'UPDATE_CLIENT_IN_PROGRESS' }),
    DELETE_CLIENT_REQUESTED: () => ({ current: 'DELETE_CLIENT_IN_PROGRESS' }),
    CLIENT_SELECTED: ({ client }, state) => {
      state.selectedClient = client
    },
  },

  CREATE_CLIENT_IN_PROGRESS: {
    CREATE_CLIENT_RESOLVED: ({ client }, state) => {
      state.clients.push(client)
      state.error = null
      return { current: 'FETCH_CLIENTS_SUCCESS' }
    },
    CREATE_CLIENT_REJECTED: ({ error }, state) => {
      state.error = error
      return { current: 'CLIENTS_FAILURE' }
    },
  },

  UPDATE_CLIENT_IN_PROGRESS: {
    UPDATE_CLIENT_RESOLVED: ({ client }, state) => {
      const index = state.clients.findIndex((c) => c.id === client.id)
      if (index !== -1) {
        state.clients[index] = client
      }
      state.selectedClient = client
      state.error = null
      return { current: 'FETCH_CLIENTS_SUCCESS' }
    },
    UPDATE_CLIENT_REJECTED: ({ error }, state) => {
      state.error = error
      return { current: 'CLIENTS_FAILURE' }
    },
  },

  DELETE_CLIENT_IN_PROGRESS: {
    DELETE_CLIENT_RESOLVED: ({ clientId }, state) => {
      state.clients = state.clients.filter((c) => c.id !== clientId)
      if (state.selectedClient?.id === clientId) {
        state.selectedClient = null
      }
      state.error = null
      return { current: 'FETCH_CLIENTS_SUCCESS' }
    },
    DELETE_CLIENT_REJECTED: ({ error }, state) => {
      state.error = error
      return { current: 'CLIENTS_FAILURE' }
    },
  },

  CLIENTS_FAILURE: {
    FETCH_CLIENTS_REQUESTED: () => ({ current: 'FETCH_CLIENTS_IN_PROGRESS' }),
    CREATE_CLIENT_REQUESTED: () => ({ current: 'CREATE_CLIENT_IN_PROGRESS' }),
    UPDATE_CLIENT_REQUESTED: () => ({ current: 'UPDATE_CLIENT_IN_PROGRESS' }),
    DELETE_CLIENT_REQUESTED: () => ({ current: 'DELETE_CLIENT_IN_PROGRESS' }),
    ERROR_CLEARED: (_, state) => {
      state.error = null
      return { current: 'FETCH_CLIENTS_SUCCESS' }
    },
  },
})

export const state = clientsMachine.create(
  { current: 'CLIENTS_INITIAL' },
  {
    clients: [],
    selectedClient: null,
    error: null,
  }
)
