"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"
import { searchItemsApi } from "@/lib/api"

interface EditSearchItemPageParams {
  id: string;
}

export default function EditSearchItemPage({ params }: { params: EditSearchItemPageParams }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<{
    minPrice: string;
    maxPrice: string;
    searchText: string;
    tagInput: string;
    tags: string[];
  }>({
    minPrice: "",
    maxPrice: "",
    searchText: "",
    tagInput: "",
    tags: [],
  })

  useEffect(() => {
    const fetchSearchItem = async () => {
      try {
        const data = await searchItemsApi.getById(params.id)
        setFormData({
          minPrice: data.minPrice?.toString() || "",
          maxPrice: data.maxPrice?.toString() || "",
          searchText: data.searchText,
          tagInput: "",
          tags: data.tags || [],
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load search item. Please try again.",
        })
        router.push("/dashboard/search-items")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchItem()
  }, [params.id, router, toast])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddTag = (e) => {
    e.preventDefault()
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: "",
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string): void => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag: string) => tag !== tagToRemove),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!formData.searchText) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Prepare data for API
      const searchItemData = {
        searchText: formData.searchText,
        minPrice: formData.minPrice ? Number.parseInt(formData.minPrice) : null,
        maxPrice: formData.maxPrice ? Number.parseInt(formData.maxPrice) : null,
        tags: formData.tags,
      }

      await searchItemsApi.update(params.id, searchItemData)

      toast({
        title: "Search item updated",
        description: "Your search item has been updated successfully.",
      })

      router.push("/dashboard/search-items")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update search item. Please try again.",
      })
      console.error("Error updating search item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Search</h1>
          <p className="text-muted-foreground">Update your Vinted search parameters</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>Modify what you're looking for on Vinted</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">

            <div className="grid gap-2">
              <Label htmlFor="searchText">Search Text</Label>
              <Input
                id="searchText"
                name="searchText"
                placeholder="e.g., vintage jeans"
                value={formData.searchText}
                onChange={handleChange}
                required
                className="rounded-md"
              />
              <p className="text-sm text-muted-foreground">The main search term to look for on Vinted</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="minPrice">Minimum Price (€)</Label>
                <Input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.minPrice}
                  onChange={handleChange}
                  className="rounded-md"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxPrice">Maximum Price (€)</Label>
                <Input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={formData.maxPrice}
                  onChange={handleChange}
                  className="rounded-md"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tagInput">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tagInput"
                  name="tagInput"
                  placeholder="Add a tag and press Enter"
                  value={formData.tagInput}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag(e)
                    }
                  }}
                  className="rounded-md"
                />
                <Button type="button" onClick={handleAddTag} className="rounded-full">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-muted">
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {tag} tag</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Keywords to refine your search (optional)</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/dashboard/search-items">
              <Button variant="outline" type="button" className="rounded-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="rounded-full">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
