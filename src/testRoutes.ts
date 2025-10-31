import type { RoutesT } from './router.effects'

export const routes: RoutesT = {
  '/': { params: [] },
  '/login': { params: ['email', 'password', 'returnTo'] },
  '/new-password': { params: ['email', 'token'] },
  '/users/:id': { params: ['tab'] },
  '/clients/:id/cars': { params: [] },
  '/clients/:id/cars/:carId': { params: ['action', 'modal'] },
}
