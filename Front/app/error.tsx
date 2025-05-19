"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto max-w-md border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            An error occurred while processing your request. Please try again or contact support if the problem
            persists.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
            className="rounded-full"
          >
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
