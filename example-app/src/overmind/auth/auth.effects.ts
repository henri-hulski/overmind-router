export type UserT = {
  id: string
  email: string
  name: string
  isAdmin?: boolean
  isManager?: boolean
  roles?: string[]
}

// Mock users for demo
const mockUsers: UserT[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: true,
    roles: ['admin', 'manager', 'client-editor'],
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'Manager User',
    isManager: true,
    roles: ['manager', 'client-editor'],
  },
  {
    id: '3',
    email: 'user@example.com',
    name: 'Regular User',
    roles: ['client-viewer'],
  },
]

export const authenticateUser = async (
  email: string,
  _password: string
): Promise<UserT | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock authentication - any password works for demo
  const user = mockUsers.find((u) => u.email === email)
  return user || null
}

export const getCurrentUser = async (): Promise<UserT | null> => {
  // Simulate checking session
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Check localStorage for demo persistence
  const storedUser = localStorage.getItem('currentUser')
  return storedUser ? JSON.parse(storedUser) : null
}

export const logout = async (): Promise<void> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300))

  localStorage.removeItem('currentUser')
}
