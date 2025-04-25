import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 1, 2025</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This Privacy Policy explains how Atlan ("we", "our", or "us") collects, uses, and discloses information
            about you when you use our Spring into Wellness application ("the App").
          </p>
          <p>
            This App is exclusively for Atlan employees and requires an @atlan.com email address to register and
            participate. By using the App, you agree to the collection and use of information in accordance with this
            policy.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>2. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-medium">Personal Information</h3>
          <p>When you register for the App, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your full name</li>
            <li>Your Atlan email address</li>
            <li>Your profile information (if provided)</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">Usage Information</h3>
          <p>When you use the App, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Wellness activities you log</li>
            <li>Points earned and your progress in the challenge</li>
            <li>Team participation information (if you join a team)</li>
            <li>Login times and frequency of use</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>3. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve the App</li>
            <li>Track your participation and progress in the wellness challenge</li>
            <li>Calculate points and determine tier achievements</li>
            <li>Facilitate team challenges and leaderboards</li>
            <li>Communicate with you about the challenge, including updates and announcements</li>
            <li>Ensure the security and integrity of the App</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>4. Information Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            As this is an internal Atlan wellness challenge, certain information will be visible to other Atlan
            employees participating in the challenge:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your name and points will appear on leaderboards</li>
            <li>If you join a team, your team members will see your contribution to team points</li>
            <li>Challenge administrators will have access to participation data to manage the challenge</li>
          </ul>
          <p className="mt-4">
            We will not share your personal information with external third parties except as required by law or with
            your explicit consent.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>5. Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We implement appropriate security measures to protect your personal information from unauthorized access,
            alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          <p>
            Your account is protected by a password. You are responsible for keeping your password confidential and for
            all activities that occur under your account.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>6. Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We will retain your personal information for the duration of the wellness challenge and for a reasonable
            period afterward to distribute prizes and analyze the results. After this period, your personal information
            will be anonymized for statistical purposes or deleted.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:surendran@atlan.com" className="text-primary hover:underline">
              surendran@atlan.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
