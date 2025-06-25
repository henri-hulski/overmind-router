import { type IContext } from 'overmind'
import {
  createActionsHook,
  createEffectsHook,
  createReactionHook,
  createStateHook,
} from 'overmind-react'
import { namespaced } from 'overmind/config'

import * as app from './app'
import * as clients from './clients'
import * as router from './router'

export const config = namespaced({
  app,
  clients,
  router,
})

export type Context = IContext<typeof config>

export const useAppState = createStateHook<Context>()
export const useActions = createActionsHook<Context>()
export const useEffects = createEffectsHook<Context>()
export const useReaction = createReactionHook<Context>()
