"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: string
  email: string
  name?: string
}

type AuthContextType = {
  user: User | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  register: (userData: { email: string; password: string; name?: string }) => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("fastvinted_token")
    const storedUser = localStorage.getItem("fastvinted_user")

    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      // Verify token validity with the server
      authApi
        .getProfile()
        .then((userData) => {
          setUser(userData)
          localStorage.setItem("fastvinted_user", JSON.stringify(userData))
        })
        .catch(() => {
          // If token is invalid, clear storage
          localStorage.removeItem("fastvinted_token")
          localStorage.removeItem("fastvinted_user")
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Redirect based on auth state
    if (!loading) {
      const publicPaths = ["/login", "/signup", "/forgot-password", "/"]
      const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith("/#")

      if (!user && !isPublicPath) {
        router.push("/login")
      } else if (user && (pathname === "/login" || pathname === "/signup")) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, pathname, router])

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await authApi.login(credentials)

      // Save token and user data
      localStorage.setItem("fastvinted_token", response.access_token)
      localStorage.setItem("fastvinted_user", JSON.stringify(response.user))

      setUser(response.user)
      router.push("/dashboard")

      toast({
        title: "Login successful",
        description: "Welcome back to FastVinted!",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
      })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("fastvinted_token")
    localStorage.removeItem("fastvinted_user")
    setUser(null)
    router.push("/login")
  }

  const register = async (userData: { email: string; password: string; }) => {
    try {
      const response = await authApi.register(userData)

      // Save token and user data
      localStorage.setItem("fastvinted_token", response.access_token)
      localStorage.setItem("fastvinted_user", JSON.stringify(response.user))

      setUser(response.user)
      router.push("/dashboard")

      toast({
        title: "Account created",
        description: "Welcome to FastVinted!",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "There was a problem creating your account.",
      })
      throw error
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, register, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
