import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: May 1, 2025</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            By accessing or using the Atlan Spring into Wellness application ("the App"), you agree to be bound by these
            Terms of Service. The App is owned and operated by Atlan. These Terms of Service affect your legal rights
            and obligations, so if you do not agree to these Terms of Service, do not use the App.
          </p>
          <p>
            The App is only available to Atlan employees with a valid @atlan.com email address. By using the App, you
            represent and warrant that you are an employee of Atlan and that you have the right, authority, and capacity
            to enter into these Terms of Service.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>2. Wellness Challenge Participation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The App is designed to facilitate participation in Atlan's "Spring into Wellness" challenge. Participation
            in the challenge is voluntary. The challenge runs from May 1, 2025, to June 30, 2025.
          </p>
          <p>
            By participating in the challenge, you agree to track your wellness activities honestly and in good faith.
            Atlan reserves the right to disqualify any participant who is found to be falsifying activity logs or
            otherwise violating the spirit of the challenge.
          </p>
          <p>
            Prizes awarded as part of the challenge are subject to availability and may be substituted at Atlan's
            discretion. Atlan reserves the right to modify the challenge rules, point system, or prizes at any time.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>3. Privacy and Data Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms of
            Service. Please review our Privacy Policy to understand how we collect, use, and disclose information about
            you.
          </p>
          <p>
            The App collects and stores information about your wellness activities, points earned, and challenge
            progress. This information may be shared with your team members (if you join a team) and may appear on
            leaderboards visible to other Atlan employees participating in the challenge.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>4. Account Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities
            that occur under your account. You agree to notify Atlan immediately of any unauthorized use of your account
            or any other breach of security.
          </p>
          <p>
            Atlan will not be liable for any loss or damage arising from your failure to comply with this security
            obligation. You may be held liable for losses incurred by Atlan or other users due to someone else using
            your account as a result of your failing to keep your account information secure and confidential.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>5. Modifications to the App and Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Atlan reserves the right to modify or discontinue, temporarily or permanently, the App or any features or
            portions thereof without prior notice. You agree that Atlan will not be liable for any modification,
            suspension, or discontinuance of the App or any part thereof.
          </p>
          <p>
            Atlan reserves the right to change these Terms of Service at any time. Updated terms will be posted on the
            App, and your continued use of the App after such changes constitutes your acceptance of the new Terms of
            Service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            If you have any questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:steven.hloros@atlan.com" className="text-primary hover:underline">
              steven.hloros@atlan.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
