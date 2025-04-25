import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">About Spring into Wellness</h1>
        <p className="text-muted-foreground">Learn more about our 61-day wellness challenge</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>What is Spring into Wellness?</CardTitle>
              <CardDescription>Our company-wide wellness initiative</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Spring into Wellness is Atlan's 61-day wellness challenge running from May 1 to June 30, 2025. The
                challenge encourages employees to develop healthy habits through daily activities that promote physical
                and mental wellbeing.
              </p>
              <p>
                Participants earn points by completing daily wellness activities, which contribute to their wellness
                tier and make them eligible for various prizes. The challenge also includes team competitions and
                special "Wellness Wednesday" events.
              </p>
              <p>
                Our goal is to foster a culture of wellbeing at Atlan while making wellness fun, social, and rewarding.
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Tracking activities and earning points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Daily Activities</h3>
                <p className="text-sm text-muted-foreground">
                  Track up to 6 daily wellness activities, each worth 5 points. Complete all activities to earn 30
                  points per day.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Wellness Tiers</h3>
                <p className="text-sm text-muted-foreground">
                  Accumulate points to reach three wellness tiers, each with its own rewards:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Wellness Seedling (640–915 points)</li>
                  <li>Wellness Bloomer (916–1,372 points)</li>
                  <li>Wellness Champion (1,373+ points)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Team Challenge</h3>
                <p className="text-sm text-muted-foreground">
                  Join a team of up to 5 members to earn bonus points on Wellness Wednesdays and compete for team
                  prizes.
                </p>
              </div>

              <div className="mt-4">
                <Link
                  href="/daily-tracker"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start Tracking
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Wellness Activities</CardTitle>
            <CardDescription>The six daily activities you can track</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-2xl mb-2">🧘</div>
                <h3 className="font-medium">Mindfulness</h3>
                <p className="text-sm text-muted-foreground">10 min meditation/yoga/deep breathing</p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-2xl mb-2">💧</div>
                <h3 className="font-medium">Hydration</h3>
                <p className="text-sm text-muted-foreground">80oz water</p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-2xl mb-2">👣</div>
                <h3 className="font-medium">Movement</h3>
                <p className="text-sm text-muted-foreground">7,000 steps</p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-2xl mb-2">😴</div>
                <h3 className="font-medium">Sleep</h3>
                <p className="text-sm text-muted-foreground">7+ hours</p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-2xl mb-2">☀️</div>
                <h3 className="font-medium">Sunshine</h3>
                <p className="text-sm text-muted-foreground">15 min outdoors</p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-2xl mb-2">💪</div>
                <h3 className="font-medium">Exercise</h3>
                <p className="text-sm text-muted-foreground">20 min workout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
