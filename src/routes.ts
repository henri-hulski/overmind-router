import type { RoutesT, UserT } from './overmind/router/router.effects'

const requiresAdmin = (user: UserT | null) => {
  if (!user || typeof user !== 'object' || user === null) return false
  return 'isAdmin' in user && (user as Record<string, unknown>).isAdmin === true
}

const requiresManagerOrAdmin = (user: UserT | null) => {
  if (!user || typeof user !== 'object' || user === null) return false
  const userObj = user as Record<string, unknown>
  return (
    ('isAdmin' in user && userObj.isAdmin === true) ||
    ('isManager' in user && userObj.isManager === true)
  )
}

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
    guard: requiresManagerOrAdmin,
  },
  '/clients/:id': {
    params: ['tab'],
    requiresAuth: true,
  },
  '/clients/:id/edit': {
    params: [],
    requiresAuth: true,
    guard: requiresManagerOrAdmin,
  },
  '/admin': {
    params: [],
    requiresAuth: true,
    guard: requiresAdmin,
  },
}
