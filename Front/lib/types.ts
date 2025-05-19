// User types
export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// Search Item types
export interface SearchItem {
  id: string
  name: string
  searchText: string
  minPrice?: number | null
  maxPrice?: number | null
  tags?: string[]
  createdAt: string
  updatedAt: string
  userId: string
  resultsCount?: number
}

export interface CreateSearchItemDto {
  name: string
  searchText: string
  minPrice?: number | null
  maxPrice?: number | null
  tags?: string[]
}

export interface UpdateSearchItemDto {
  name?: string
  searchText?: string
  minPrice?: number | null
  maxPrice?: number | null
  tags?: string[]
}

// Item types
export interface Item {
  id: string
  name: string
  price: number
  size?: string
  condition?: string
  vendor?: string
  vendorUrl?: string
  itemUrl: string
  imageUrl?: string
  searchItemId: string
  userId: string
  createdAt: string
  updatedAt: string
}
