import { statemachine } from 'overmind'

import type { UserT } from './auth.effects'

export type CredentialsT = {
  email: string
  password: string
}

type States =
  | {
      current: 'UNAUTHENTICATED'
      credentials: CredentialsT
    }
  | {
      current: 'AUTHENTICATION_IN_PROGRESS'
      credentials: CredentialsT
    }
  | {
      current: 'AUTHENTICATION_FAILURE'
      credentials: CredentialsT
      errorMsg: string
      errorType: string
    }
  | {
      current: 'AUTHENTICATED'
      user: UserT
    }
  | {
      current: 'SESSION_CHECK_IN_PROGRESS'
    }

type Events =
  | {
      type: 'USER_SIGN_IN_REQUESTED'
    }
  | {
      type: 'USER_SIGN_IN_REJECTED'
      data: {
        errorMsg: string
        errorType: string
      }
    }
  | {
      type: 'USER_SIGN_IN_RESOLVED'
      data: { user: UserT }
    }
  | {
      type: 'SESSION_CHECK_REQUESTED'
    }
  | {
      type: 'SESSION_CHECK_RESOLVED'
      data: { user: UserT }
    }
  | {
      type: 'SESSION_CHECK_FAILED'
    }
  | {
      type: 'EMAIL_CHANGED'
      data: Pick<CredentialsT, 'email'>
    }
  | {
      type: 'PASSWORD_CHANGED'
      data: Pick<CredentialsT, 'password'>
    }
  | {
      type: 'USER_SIGNED_OUT'
    }

type UNAUTHENTICATED_T = {
  current: 'UNAUTHENTICATED' | 'AUTHENTICATION_FAILURE'
  credentials: CredentialsT
}

function USER_SIGN_IN_REQUESTED(
  _: unknown,
  state: UNAUTHENTICATED_T
): void | States {
  return {
    current: 'AUTHENTICATION_IN_PROGRESS',
    credentials: { ...state.credentials },
  }
}

function EMAIL_CHANGED(
  { email }: { email: string },
  state: UNAUTHENTICATED_T
): void | States {
  state.credentials.email = email
}

function PASSWORD_CHANGED(
  { password }: { password: string },
  state: UNAUTHENTICATED_T
): void | States {
  state.credentials.password = password
}

function SESSION_CHECK_REQUESTED(): void | States {
  return {
    current: 'SESSION_CHECK_IN_PROGRESS',
  }
}

function USER_SIGNED_OUT(): void | States {
  return {
    current: 'UNAUTHENTICATED',
    credentials: { email: '', password: '' },
  }
}

const AUTHENTICATING = {
  USER_SIGN_IN_REQUESTED,
  EMAIL_CHANGED,
  PASSWORD_CHANGED,
}

const authMachine = statemachine<States, Events>({
  UNAUTHENTICATED: {
    ...AUTHENTICATING,
    SESSION_CHECK_REQUESTED,
  },
  AUTHENTICATED: {
    USER_SIGNED_OUT,
    SESSION_CHECK_REQUESTED,
  },
  AUTHENTICATION_IN_PROGRESS: {
    USER_SIGN_IN_REJECTED: ({ errorMsg, errorType }, state) => {
      return {
        current: 'AUTHENTICATION_FAILURE',
        credentials: { ...state.credentials },
        errorMsg,
        errorType,
      }
    },
    USER_SIGN_IN_RESOLVED: ({ user }) => {
      return {
        current: 'AUTHENTICATED',
        user,
      }
    },
  },
  AUTHENTICATION_FAILURE: {
    ...AUTHENTICATING,
  },
  SESSION_CHECK_IN_PROGRESS: {
    SESSION_CHECK_RESOLVED: ({ user }) => {
      return {
        current: 'AUTHENTICATED',
        user,
      }
    },
    SESSION_CHECK_FAILED: () => {
      return {
        current: 'UNAUTHENTICATED',
        credentials: { email: '', password: '' },
      }
    },
  },
})

export const state = authMachine.create({
  current: 'UNAUTHENTICATED',
  credentials: {
    email: '',
    password: '',
  },
})
