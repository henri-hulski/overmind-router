import type { RoutesT } from '@ovtools/router'

import type { UserT } from './overmind/auth/auth.effects'

// Define guard functions for authorization
const hasAdminRole = (user: UserT | null) => !!(user && user.isAdmin)
const hasManagerRole = (user: UserT | null) =>
  !!(user && (user.isAdmin || user.isManager))

export const routes: RoutesT = {
  '/': {
    params: [],
  },
  '/login': {
    params: [],
  },
  '/clients': {
    params: ['search', 'page'],
    requiresAuth: true,
  },
  '/clients/new': {
    params: [],
    requiresAuth: true,
    guard: hasManagerRole,
  },
  '/clients/:id': {
    params: ['tab'],
    requiresAuth: true,
  },
  '/clients/:id/edit': {
    params: [],
    requiresAuth: true,
    guard: hasManagerRole,
  },
  '/admin': {
    params: [],
    requiresAuth: true,
    guard: hasAdminRole,
  },
}
