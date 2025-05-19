"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { searchItemsApi } from "@/lib/api"

export default function NewSearchItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<{
    minPrice: string
    maxPrice: string
    searchText: string
    tagInput: string
    tags: string[]
  }>({
    minPrice: "",
    maxPrice: "",
    searchText: "",
    tagInput: "",
    tags: [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddTag = (e: React.FormEvent<HTMLButtonElement>) => {
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

  interface SearchItemData {
    searchText: string
    minPrice: number | null
    maxPrice: number | null
    tags: string[]
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setIsSubmitting(true)
    console.log("Form data:", formData)
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
      const searchItemData: SearchItemData = {
        searchText: formData.searchText,
        minPrice: formData.minPrice ? Number.parseInt(formData.minPrice) : null,
        maxPrice: formData.maxPrice ? Number.parseInt(formData.maxPrice) : null,
        tags: formData.tags,
      }

      await searchItemsApi.create(searchItemData)

      toast({
        title: "Search item created",
        description: "Your new search item has been created successfully.",
      })

      router.push("/dashboard/search-items")
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create search item. Please try again.",
      })
      console.error("Error creating search item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Search</h1>
          <p className="text-muted-foreground">Set up parameters for your Vinted search</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>Define what you're looking for on Vinted</CardDescription>
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
              {isSubmitting ? "Creating..." : "Create Search"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
