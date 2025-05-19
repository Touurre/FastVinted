"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, ArrowRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { searchItemsApi, itemsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    activeSearches: 0,
    totalResults: 0,
  })
  const [recentItems, setRecentItems] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch search items and all items
      const [searchItems, items] = await Promise.all([searchItemsApi.getAll(), itemsApi.getAll()])

      setStats({
        activeSearches: searchItems.length,
        totalResults: items.length,
      })

      // Get the 6 most recent items
      const sortedItems = [...items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)

      setRecentItems(sortedItems)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
      })
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back ! Here's an overview of your Vinted searches.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-md hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Searches</CardTitle>
                <Search className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSearches}</div>
                <p className="text-xs text-muted-foreground">Search items you're currently tracking</p>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/search-items" className="w-full">
                  <Button variant="outline" className="w-full rounded-full">
                    View all searches
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="border-0 shadow-md hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Results</CardTitle>
                <ArrowRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalResults}</div>
                <p className="text-xs text-muted-foreground">Items found matching your criteria</p>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/results" className="w-full">
                  <Button variant="outline" className="w-full rounded-full">
                    View all results
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2 lg:col-span-3 border-0 shadow-md">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>The latest items matching your search criteria</CardDescription>
              </CardHeader>
              <CardContent>
                {recentItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground mb-4">No results found yet.</p>
                    <Link href="/dashboard/search-items/new">
                      <Button className="rounded-full">Create a search</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recentItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-lg border p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="h-16 w-16 rounded-md bg-muted relative overflow-hidden">
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="grid gap-1">
                          <h3 className="font-medium line-clamp-1">{item.name}</h3>
                          <p className="text-sm text-primary font-semibold">€{item.price}</p>
                          <div className="flex gap-1">
                            {item.size && (
                              <Badge variant="outline" className="text-xs">
                                {item.size}
                              </Badge>
                            )}
                            {item.condition && (
                              <Badge variant="outline" className="text-xs">
                                {item.condition}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/results" className="w-full">
                  <Button variant="outline" className="w-full rounded-full">
                    View all results
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
