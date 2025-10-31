export type ClientT = {
  id: number
  name: string
  company: string
  email: string
  phone: string
  address: string
  status: 'Active' | 'Inactive' | 'Prospect'
  createdAt: string
}

export type PostClientT = Omit<ClientT, 'id' | 'createdAt'>

// Mock data for demonstration
const mockClients: ClientT[] = [
  {
    id: 1,
    name: 'John Doe',
    company: 'Acme Corp',
    email: 'john.doe@acme.com',
    phone: '+1-555-0123',
    address: '123 Main St\nNew York, NY 10001',
    status: 'Active',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    company: 'TechStart Inc',
    email: 'jane.smith@techstart.com',
    phone: '+1-555-0456',
    address: '456 Oak Ave\nSan Francisco, CA 94102',
    status: 'Active',
    createdAt: '2024-02-20',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    company: 'Global Solutions',
    email: 'bob.johnson@global.com',
    phone: '+1-555-0789',
    address: '789 Pine Dr\nChicago, IL 60601',
    status: 'Prospect',
    createdAt: '2024-03-10',
  },
]

let nextId = 4

export const api = {
  async getClients(): Promise<ClientT[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    return [...mockClients]
  },

  async getClientById(id: number): Promise<ClientT | null> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockClients.find((client) => client.id === id) || null
  },

  async createClient(clientData: PostClientT): Promise<ClientT> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newClient: ClientT = {
      ...clientData,
      id: nextId++,
      createdAt: new Date().toISOString().split('T')[0],
    }

    mockClients.push(newClient)
    return newClient
  },

  async updateClient(
    id: number,
    updates: Partial<PostClientT>
  ): Promise<ClientT> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    const clientIndex = mockClients.findIndex((client) => client.id === id)
    if (clientIndex === -1) {
      throw new Error(`Client with id ${id} not found`)
    }

    mockClients[clientIndex] = {
      ...mockClients[clientIndex],
      ...updates,
    }

    return mockClients[clientIndex]
  },

  async deleteClient(id: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400))

    const clientIndex = mockClients.findIndex((client) => client.id === id)
    if (clientIndex === -1) {
      throw new Error(`Client with id ${id} not found`)
    }

    mockClients.splice(clientIndex, 1)
  },
}
