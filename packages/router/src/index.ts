import { type IContext } from 'overmind'

import * as actions from './router.actions'
import { createRouterEffects } from './router.effects'
import { state } from './router.state'

export type {
  ParamsT,
  ParsedRouteT,
  RouteConfigT,
  RouteGuard,
  RouteGuardResult,
  RoutesT,
  RouteT,
  UserT,
} from './router.effects'

export interface RouterConfig {
  baseUrl?: string
}

export const createRouter = (config: RouterConfig = {}) => ({
  state,
  actions,
  effects: createRouterEffects(config),
})

// Default export for simple usage
export const router = createRouter()

export const config = router

export type Context = IContext<typeof config>
