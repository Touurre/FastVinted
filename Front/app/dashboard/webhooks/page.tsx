"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, Send, Trash2 } from "lucide-react"
import { webhookApi } from "@/lib/api"
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

export default function WebhooksPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [hasWebhook, setHasWebhook] = useState(false)

  useEffect(() => {
    fetchWebhook()
  }, [])

  const fetchWebhook = async () => {
    setIsLoading(true)
    try {
      const data = await webhookApi.getDiscordWebhook()
      if (data && data.url) {
        setWebhookUrl(data.url)
        setHasWebhook(true)
      }
    } catch (error) {
      console.error("Error fetching webhook:", error)
      // If 404, it means no webhook is set up yet, which is fine
      if (error.message !== "Not Found") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load webhook configuration.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWebhook = async () => {
    if (!webhookUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Discord webhook URL.",
      })
      return
    }

    // Basic validation for Discord webhook URL
    if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      toast({
        variant: "destructive",
        title: "Invalid webhook URL",
        description: "Please enter a valid Discord webhook URL.",
      })
      return
    }

    setIsSaving(true)
    try {
      await webhookApi.saveDiscordWebhook(webhookUrl)
      setHasWebhook(true)
      toast({
        title: "Webhook saved",
        description: "Your Discord webhook has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving webhook:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save webhook. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discord Notifications</h1>
          <p className="text-muted-foreground">
            Set up Discord notifications for new items matching your search criteria
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <Card className="pt-4">
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="rounded-md"
              />
              <p className="text-sm text-muted-foreground">
                Enter the webhook URL from your Discord server. You can create a webhook in your Discord server
                settings.
              </p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <h3 className="font-medium mb-2">How to create a Discord webhook</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open your Discord server and go to Server Settings</li>
                <li>Click on "Integrations" and then "Webhooks"</li>
                <li>Click "New Webhook" and give it a name (e.g., "FastVinted Notifications")</li>
                <li>Choose the channel where you want to receive notifications</li>
                <li>Click "Copy Webhook URL" and paste it above</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div></div>
            <Button
              className="gap-2 rounded-full"
              onClick={handleSaveWebhook}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {hasWebhook ? "Update Webhook" : "Save Webhook"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
