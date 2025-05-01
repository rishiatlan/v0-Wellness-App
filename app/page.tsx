"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle, LineChart, Trophy, Users, Shield } from "lucide-react"
import { isAdmin } from "@/lib/admin-utils"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="container px-4 py-8 md:py-12">
      {/* Hero Section */}
      <section className="mb-12 space-y-6 text-center">
        <div className="space-y-2">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="https://mqvcdyzqegzqfwvesoiz.supabase.co/storage/v1/object/public/email-assets//wellness.png"
              width={120}
              height={120}
              alt="Spring into Wellness Logo"
              className="object-contain"
              unoptimized
            />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Spring into Wellness</h1>
          </div>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Join Atlan's 61-day wellness challenge (May 1 – June 30, 2025)
          </p>
        </div>
        <div className="mx-auto max-w-lg">
          <Image
            src="/flourishing-wellbeing.png"
            width={600}
            height={300}
            alt="Wellness Challenge Illustration"
            className="rounded-lg object-cover"
          />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
          >
            <Link href="/daily-tracker">Start Tracking</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* App Features Section */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-center">Your Wellness Journey</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle>Daily Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Log your daily wellness activities and earn points.</CardDescription>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/daily-tracker" className="flex items-center justify-between">
                  <span>Track Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <LineChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>My Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                View your wellness journey and track your tier progress.
              </CardDescription>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/my-progress" className="flex items-center justify-between">
                  <span>View Progress</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Team Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Join a team and earn bonus points on Wellness Wednesdays.
              </CardDescription>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/team-challenge" className="flex items-center justify-between">
                  <span>Join Team</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                See who's leading the challenge and compete for the top spot.
              </CardDescription>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/leaderboard" className="flex items-center justify-between">
                  <span>View Leaderboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Quick Access - Only visible to admins */}
          {user?.email && isAdmin(user.email) && (
            <Card>
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">Manage users, teams, and system settings.</CardDescription>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/admin" className="flex items-center justify-between">
                    <span>Access Admin</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Wellness Activities Section */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-center">Wellness Activities</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">🧘</div>
              <CardTitle className="text-base mb-1">Mindfulness</CardTitle>
              <CardDescription className="text-xs">10 min meditation</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">💧</div>
              <CardTitle className="text-base mb-1">Hydration</CardTitle>
              <CardDescription className="text-xs">80oz (2.36 liters) water</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">👣</div>
              <CardTitle className="text-base mb-1">Movement</CardTitle>
              <CardDescription className="text-xs">7,000 steps</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">😴</div>
              <CardTitle className="text-base mb-1">Sleep</CardTitle>
              <CardDescription className="text-xs">7+ hours</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">☀️</div>
              <CardTitle className="text-base mb-1">Sunshine</CardTitle>
              <CardDescription className="text-xs">15 min outdoors</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">💪</div>
              <CardTitle className="text-base mb-1">Exercise</CardTitle>
              <CardDescription className="text-xs">20 min workout</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Wellness Tiers Section */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-center">Wellness Tiers</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <div className="text-4xl mb-2">🌱</div>
              <CardTitle>Wellness Seedling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">640–915 points</CardDescription>
              <div className="text-sm">
                <p>The beginning of your wellness journey. Establish healthy habits and build consistency.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-2">
              <div className="text-4xl mb-2">🌿</div>
              <CardTitle>Wellness Bloomer</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">916–1,372 points</CardDescription>
              <div className="text-sm">
                <p>Your wellness habits are flourishing. Continue to grow and inspire others around you.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="text-4xl mb-2">🌳</div>
              <CardTitle>Wellness Champion</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">1,373+ points</CardDescription>
              <div className="text-sm">
                <p>You've reached the highest tier! Your dedication to wellness is an inspiration to all.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 p-8 dark:from-teal-950/30 dark:to-blue-950/30">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Wellness Journey?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join the Spring into Wellness challenge today and start tracking your daily wellness activities. Every small
            step counts towards a healthier, happier you.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
          >
            <Link href="/daily-tracker">Get Started Now</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
