import Link from "next/link"
import { APP_VERSION } from "@/lib/env-vars"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-navy-800 bg-navy-950 py-6 text-white">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <p className="text-sm text-gray-400">&copy; {currentYear} Atlan. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-gray-400 hover:text-white">
              Contact
            </Link>
          </div>
        </div>
        <div className="text-xs text-gray-500">Version {APP_VERSION}</div>
      </div>
    </footer>
  )
}
