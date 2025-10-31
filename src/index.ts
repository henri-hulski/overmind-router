import { type IContext } from 'overmind'

import * as actions from './router.actions'
import { router as effects } from './router.effects'
import { state } from './router.state'

export { actions, effects, state }

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

export const config = {
  state,
  actions,
  effects,
}

export type Context = IContext<typeof config>
