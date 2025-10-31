import { statemachine } from 'overmind'

type States = { current: 'APP_INITIAL' } | { current: 'APP_READY' }

type Events = { type: 'APP_INITIALIZED' }

const appMachine = statemachine<States, Events>({
  APP_INITIAL: {
    APP_INITIALIZED: () => ({ current: 'APP_READY' }),
  },
  APP_READY: {},
})

export const state = appMachine.create({
  current: 'APP_INITIAL',
})
