"use client"

// COMPLETELY ISOLATED HEADER FOR PAGES DIRECTORY
// NO IMPORTS FROM ANYWHERE THAT MIGHT USE SERVER COMPONENTS

import Link from "next/link"
import { useState, useEffect } from "react"
import { pagesClient, pagesSignOut } from "@/lib/pages-client-isolated"

export default function PagesHeaderIsolated() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const { data } = await pagesClient.auth.getSession()
        setUser(data.session?.user || null)
      } catch (err) {
        console.error("Error checking auth:", err)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = pagesClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await pagesSignOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header
      style={{
        padding: "1rem",
        borderBottom: "1px solid #eaeaea",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <Link href="/">
          <a style={{ fontWeight: "bold", fontSize: "1.25rem" }}>Spring into Wellness</a>
        </Link>
      </div>
      <nav>
        <ul style={{ display: "flex", gap: "1rem", listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            <Link href="/daily-tracker">
              <a>Daily Tracker</a>
            </Link>
          </li>
          <li>
            <Link href="/my-progress">
              <a>My Progress</a>
            </Link>
          </li>
          <li>
            <Link href="/team-challenge">
              <a>Team Challenge</a>
            </Link>
          </li>
          <li>
            <Link href="/leaderboard">
              <a>Leaderboard</a>
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link href="/profile">
                  <a>Profile</a>
                </Link>
              </li>
              <li>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#0070f3",
                    padding: 0,
                  }}
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/auth/login">
                <a>Sign In</a>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
