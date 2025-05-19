import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto max-w-md border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Search className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Please check the URL or go back to the
            homepage.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/">
            <Button className="rounded-full">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
