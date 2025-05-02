import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const errorData = await request.json()

    // Log the error to the console in all environments
    console.error("Client error logged:", errorData)

    // Here you would typically send the error to your monitoring service
    // For example: await sendToMonitoringService(errorData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in log-error API route:", error)
    return NextResponse.json({ success: false, error: "Failed to log error" }, { status: 500 })
  }
}
