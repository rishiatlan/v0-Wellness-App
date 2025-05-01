"use client"

import Link from "next/link"
import Image from "next/image"
import { getEmailAssetUrl, getFallbackAssetUrl } from "@/lib/asset-utils"
import { useState } from "react"

export default function Footer() {
  const [imageError, setImageError] = useState(false)
  const logoUrl = imageError ? getFallbackAssetUrl("wellness.png") : getEmailAssetUrl("wellness.png")

  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Image
            src={logoUrl || "/placeholder.svg"}
            width={24}
            height={24}
            alt="Spring into Wellness Logo"
            className="object-contain"
            onError={() => setImageError(true)}
            unoptimized
          />
          <span className="text-sm font-medium">Spring into Wellness 2025</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link href="/health" className="hover:underline">
            Health Info
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
