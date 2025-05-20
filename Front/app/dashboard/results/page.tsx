"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, ExternalLink, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { searchItemsApi, itemsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { SearchIcon } from "lucide-react"
import { set } from "date-fns"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const searchId = searchParams.get("search")
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState([])
  const [searchInfo, setSearchInfo] = useState(null)
  const [sortBy, setSortBy] = useState("createdAt")
  const [order, setOrder] = useState<"desc" | "asc">("desc")
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 12

  useEffect(() => {
    fetchData()
  }, [searchId, currentPage, sortBy, order])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      let response
      let searchData = null
      let totalItems = 0

      if (searchId) {
        // Fetch specific search item and its results
        ;[searchData, response, totalItems] = await Promise.all([
          searchItemsApi.getById(searchId),
          itemsApi.getBySearchItem(searchId, currentPage, itemsPerPage, sortBy, order),
          itemsApi.numberOfItemsPerSearch(searchId),
        ])

        setSearchInfo({
          id: searchId,
          name: searchData.searchText,
          lastUpdated: new Date().toISOString(),
        })
        setTotalItems(totalItems)
      } else {
        // Fetch all items
        response = await itemsApi.getAll(currentPage, itemsPerPage, sortBy, order)
        totalItems = await itemsApi.numberOfItems()

        setSearchInfo({
          id: "all",
          name: "All Searches",
          lastUpdated: new Date().toISOString(),
        })
        setTotalItems(totalItems)
      }

      setResults(response)
      setTotalPages(Math.ceil((totalItems) / itemsPerPage))
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

  const handleSortChange = (value: string) => {
    // Split the value into sortBy and order
    const [newSortBy, newOrder] = value.split("-") as [string, "desc" | "asc"]
    setSortBy(newSortBy)
    setOrder(newOrder)
  }

  const getSortValue = () => {
    return `${sortBy}-${order}`
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
          <p className="text-muted-foreground">
            {searchInfo
              ? searchInfo.id === "all"
                ? "Showing all results"
                : `Showing results for "${searchInfo.name}"`
              : "Loading search information..."}
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
          <Select value={getSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
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
              <span>
              </span>
              <span>Last updated: {new Date(searchInfo.lastUpdated).toLocaleString()}</span>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((item) => (
              <Card key={item.id} className="overflow-hidden border-0 shadow-md hover-scale">
                <div className="relative aspect-square">
                  <Image
                    src={item.imageUrl || "/placeholder.svg?height=400&width=400"}
                    alt={item.searchText}
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
                      <span className="text-sm text-muted-foreground">
                        {item.sellerName || "Seller"}
                      </span>
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

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current page
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                  })
                  .map((page, index, array) => {
                    // Add ellipsis where needed
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <div key={`ellipsis-${page}`} className="flex items-center">
                          <span className="px-2 text-muted-foreground">...</span>
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            className="rounded-full w-8 h-8"
                            onClick={() => handlePageChange(page)}
                            disabled={isLoading}
                          >
                            {page}
                          </Button>
                        </div>
                      )
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                      >
                        {page}
                      </Button>
                    )
                  })}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}