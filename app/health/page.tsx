import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function HealthPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Health Information</h1>
        <p className="text-muted-foreground">
          Important health information for participants in the Spring into Wellness challenge
        </p>
      </div>

      <Alert className="mb-8 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          The information provided on this page is for general informational purposes only and is not intended as
          medical advice. Always consult with a healthcare professional before starting any new fitness or wellness
          program.
        </AlertDescription>
      </Alert>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About the Challenge Activities</CardTitle>
          <CardDescription>Understanding the wellness activities in our challenge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-medium">Mindfulness (🧘)</h3>
          <p>
            Mindfulness involves focusing your awareness on the present moment while acknowledging and accepting your
            feelings, thoughts, and bodily sensations. For the challenge, practice at least 10 minutes of mindfulness or
            meditation daily.
          </p>
          <p>
            <strong>Benefits:</strong> Reduced stress, improved focus, better emotional regulation, and enhanced overall
            well-being.
          </p>

          <h3 className="text-lg font-medium mt-4">Hydration (💧)</h3>
          <p>
            Proper hydration is essential for overall health. For the challenge, aim to drink at least 8 glasses (64 oz)
            of water throughout the day.
          </p>
          <p>
            <strong>Benefits:</strong> Improved cognitive function, better physical performance, healthier skin, and
            proper organ function.
          </p>

          <h3 className="text-lg font-medium mt-4">Movement (👣)</h3>
          <p>
            Regular movement throughout the day helps counteract the negative effects of prolonged sitting. For the
            challenge, take regular movement breaks throughout your workday.
          </p>
          <p>
            <strong>Benefits:</strong> Reduced risk of chronic disease, improved posture, increased energy, and better
            circulation.
          </p>

          <h3 className="text-lg font-medium mt-4">Sleep (😴)</h3>
          <p>
            Quality sleep is fundamental to health and well-being. For the challenge, aim for 7-8 hours of quality sleep
            each night.
          </p>
          <p>
            <strong>Benefits:</strong> Improved cognitive function, better mood regulation, stronger immune system, and
            enhanced recovery.
          </p>

          <h3 className="text-lg font-medium mt-4">Sunshine (☀️)</h3>
          <p>
            Exposure to natural light helps regulate your circadian rhythm and vitamin D production. For the challenge,
            spend at least 15 minutes outdoors in natural light daily.
          </p>
          <p>
            <strong>Benefits:</strong> Improved mood, better sleep quality, vitamin D production, and enhanced overall
            well-being.
          </p>

          <h3 className="text-lg font-medium mt-4">Exercise (💪)</h3>
          <p>
            Regular physical activity is crucial for physical and mental health. For the challenge, complete at least 30
            minutes of moderate physical exercise daily.
          </p>
          <p>
            <strong>Benefits:</strong> Improved cardiovascular health, stronger muscles and bones, better mental health,
            and reduced risk of chronic diseases.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Health Recommendations</CardTitle>
          <CardDescription>General guidelines for a healthy lifestyle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-medium">Start Gradually</h3>
          <p>
            If you're new to any of these wellness activities, start slowly and gradually increase intensity or
            duration. Listen to your body and avoid pushing yourself too hard too quickly.
          </p>

          <h3 className="text-lg font-medium mt-4">Stay Consistent</h3>
          <p>
            Consistency is more important than intensity. It's better to do a moderate amount regularly than to do an
            intense session occasionally.
          </p>

          <h3 className="text-lg font-medium mt-4">Balance is Key</h3>
          <p>
            A balanced approach to wellness includes physical activity, proper nutrition, adequate rest, stress
            management, and social connection. Try to incorporate all aspects into your routine.
          </p>

          <h3 className="text-lg font-medium mt-4">Listen to Your Body</h3>
          <p>
            Pay attention to how your body responds to different activities. If something causes pain or discomfort,
            modify or stop the activity and consult a healthcare professional if needed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>Helpful resources for your wellness journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>For more information on health and wellness, check out these resources:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Link
                href="https://www.who.int/health-topics/physical-activity"
                className="text-primary hover:underline"
                target="_blank"
              >
                World Health Organization - Physical Activity
              </Link>
            </li>
            <li>
              <Link
                href="https://www.cdc.gov/healthyweight/healthy_eating/index.html"
                className="text-primary hover:underline"
                target="_blank"
              >
                CDC - Healthy Eating for a Healthy Weight
              </Link>
            </li>
            <li>
              <Link href="https://www.sleepfoundation.org/" className="text-primary hover:underline" target="_blank">
                National Sleep Foundation
              </Link>
            </li>
            <li>
              <Link href="https://www.mindful.org/" className="text-primary hover:underline" target="_blank">
                Mindful.org - Meditation Resources
              </Link>
            </li>
          </ul>
          <p className="mt-4">
            If you have specific health concerns or questions about participating in the wellness challenge, please
            contact{" "}
            <a href="mailto:Rishi.Banerjee@atlan.com" className="text-primary hover:underline">
              Rishi.Banerjee@atlan.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
