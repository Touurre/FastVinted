"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, AlertCircle, Tag, Euro, SearchIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { searchItemsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function SearchItemsPage() {
  const [searchItems, setSearchItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSearchItems()
  }, [])

  const fetchSearchItems = async () => {
    setIsLoading(true)
    try {
      const data = await searchItemsApi.getAll()
      setSearchItems(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load search items. Please try again.",
      })
      console.error("Error fetching search items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSearchItem = async (id) => {
    try {
      await searchItemsApi.delete(id)
      setSearchItems(searchItems.filter((item) => item.id !== id))
      toast({
        title: "Search item deleted",
        description: "The search item has been deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete search item. Please try again.",
      })
      console.error("Error deleting search item:", error)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Items</h1>
          <p className="text-muted-foreground">Manage your Vinted search parameters</p>
        </div>
        <Link href="/dashboard/search-items/new">
          <Button className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            Add New Search
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="h-6 w-1/3 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-1/4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchItems.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No search items yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first search item to start tracking Vinted listings
            </p>
            <Link href="/dashboard/search-items/new">
              <Button className="gap-2 rounded-full">
                <Plus className="h-4 w-4" />
                Add New Search
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {searchItems.map((item) => (
            <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{item.name}</CardTitle>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/search-items/${item.id}/edit`}>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this search item and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSearchItem(item.id)} className="rounded-full">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardDescription>Created on {new Date(item.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      Price range: €{item.minPrice || 0} - €{item.maxPrice || "Any"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SearchIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">Search text: "{item.searchText}"</span>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/dashboard/results?search=${item.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    View Results
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
