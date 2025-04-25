import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, User, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Contact Us</h1>
        <p className="text-muted-foreground">
          Have questions about the Spring into Wellness challenge? We're here to help!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Reach out to our team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Steven Hloros</h3>
                  <a
                    href="mailto:steven.hloros@atlan.com"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <Mail className="h-3 w-3" /> steven.hloros@atlan.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Surendran</h3>
                  <a
                    href="mailto:surendran@atlan.com"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <Mail className="h-3 w-3" /> surendran@atlan.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Rishi Banerjee</h3>
                  <a
                    href="mailto:Rishi.Banerjee@atlan.com"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <Mail className="h-3 w-3" /> Rishi.Banerjee@atlan.com
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Find answers to common questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> About the Challenge
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Learn more about how the Spring into Wellness challenge works, including point system, tiers, and
                prizes.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/">View Challenge Details</Link>
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Health Information
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Find information about the health benefits of the challenge activities and general wellness tips.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/health">View Health Information</Link>
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Terms & Privacy
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Review our terms of service and privacy policy for information about how we handle your data.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/terms">Terms of Service</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/privacy">Privacy Policy</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
