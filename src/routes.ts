import type { RoutesT } from './overmind/router/router.effects'

export const routes: RoutesT = {
  '/': { params: [] },
  '/clients': { params: ['search', 'page'] },
  '/clients/new': { params: [] },
  '/clients/:id': { params: ['tab'] },
  '/clients/:id/edit': { params: [] },
}
