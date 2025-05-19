// Base API URL - in a real app, this would come from environment variables
const API_URL = "http://localhost:4200" // Change this to your actual API URL

// Helper function for making authenticated requests
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("fastvinted_token")

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle unauthorized responses
  if (response.status === 401) {
    localStorage.removeItem("fastvinted_token")
    localStorage.removeItem("fastvinted_user")
    window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong")
  }

  return data
}

// Auth API
export const authApi = {
  register: async (userData: { email: string; password: string }) => {
    return fetchWithAuth("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  login: async (credentials: { email: string; password: string }) => {
    return fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  getProfile: async () => {
    return fetchWithAuth("/auth/profile")
  },
}

// Search Items API
export const searchItemsApi = {
  create: async (searchItem: any) => {
    return fetchWithAuth("/search-items", {
      method: "POST",
      body: JSON.stringify(searchItem),
    })
  },

  getAll: async () => {
    return fetchWithAuth("/search-items")
  },

  getById: async (id: string) => {
    return fetchWithAuth(`/search-items/${id}`)
  },

  update: async (id: string, searchItem: any) => {
    return fetchWithAuth(`/search-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(searchItem),
    })
  },

  delete: async (id: string) => {
    return fetchWithAuth(`/search-items/${id}`, {
      method: "DELETE",
    })
  },
}

// Items API
export const itemsApi = {
  getAll: async () => {
    return fetchWithAuth("/items")
  },

  getBySearchItem: async (searchItemId: string) => {
    return fetchWithAuth(`/items/search/${searchItemId}`)
  },

  getById: async (id: string) => {
    return fetchWithAuth(`/items/${id}`)
  },

  delete: async (id: string) => {
    return fetchWithAuth(`/items/${id}`, {
      method: "DELETE",
    })
  },
}
