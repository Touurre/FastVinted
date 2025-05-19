"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { searchItemsApi, itemsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { SearchIcon } from "lucide-react"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const searchId = searchParams.get("search")
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState([])
  const [searchInfo, setSearchInfo] = useState(null)
  const [sortBy, setSortBy] = useState("newest")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [searchId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      let itemsData
      let searchData = null

      if (searchId) {
        // Fetch specific search item and its results
        ;[searchData, itemsData] = await Promise.all([
          searchItemsApi.getById(searchId),
          itemsApi.getBySearchItem(searchId),
        ])

        setSearchInfo({
          id: searchId,
          name: searchData.name,
          lastUpdated: new Date().toISOString(),
        })
      } else {
        // Fetch all items
        itemsData = await itemsApi.getAll()

        setSearchInfo({
          id: "all",
          name: "All Searches",
          lastUpdated: new Date().toISOString(),
        })
      }

      setResults(itemsData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load results. Please try again.",
      })
      console.error("Error fetching results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchData()
    toast({
      title: "Results refreshed",
      description: "The latest results have been loaded.",
    })
  }

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt)
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt)
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      default:
        return 0
    }
  })

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
          <p className="text-muted-foreground">
            {searchInfo ? `Showing results for "${searchInfo.name}"` : "Loading search information..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-md">
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <SearchIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground text-center mb-6">
              No items matching your search criteria were found. Try adjusting your search parameters.
            </p>
            <Link href="/dashboard/search-items">
              <Button className="rounded-full">Manage Search Items</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {searchInfo && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Found {results.length} items</span>
              <span>Last updated: {new Date(searchInfo.lastUpdated).toLocaleString()}</span>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedResults.map((item) => (
              <Card key={item.id} className="overflow-hidden border-0 shadow-md hover-scale">
                <div className="relative aspect-square">
                  <Image
                    src={item.imageUrl || "/placeholder.svg?height=400&width=400"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="grid gap-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium line-clamp-2">{item.name}</h3>
                      <span className="font-bold text-primary">€{item.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.size && (
                        <Badge variant="outline" className="rounded-full">
                          {item.size}
                        </Badge>
                      )}
                      {item.condition && (
                        <Badge variant="outline" className="rounded-full">
                          {item.condition}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div
                        className="text-sm text-muted-foreground"
                      >
                        {item.sellerName || "Seller"}
                      </div>
                      <Link href={item.url || "#"} target="_blank">
                        <Button variant="outline" size="sm" className="gap-1 rounded-full">
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
