// Generate consistent avatars based on user/team ID or email
export function getAvatarUrl(identifier: string, type: "user" | "team" = "user"): string {
  if (!identifier) {
    identifier = type === "user" ? "default-user" : "default-team"
  }

  // Use different styles for users vs teams
  const style = type === "user" ? "adventurer" : "shapes"

  // Create a deterministic seed from the identifier
  const seed = encodeURIComponent(identifier)

  // Return a DiceBear avatar URL
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
}

// Get initials from name or email for avatar fallback
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"

  // If it looks like an email, use the first character
  if (name.includes("@")) {
    return name.split("@")[0].charAt(0).toUpperCase()
  }

  // Otherwise get initials from name (up to 2 characters)
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}
