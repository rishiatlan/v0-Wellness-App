// Generate consistent avatars based on user/team IDs
export function getAvatarUrl(id: string, type: "user" | "team" = "user"): string {
  // Use different styles for users vs teams
  const style = type === "user" ? "adventurer" : "shapes"

  // Create a hash from the ID to ensure consistency
  const hash = hashString(id)

  // Return a DiceBear avatar URL
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(hash)}`
}

// Get initials from a name or email
export function getInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return "?"

  // If it's an email, use the first character of the username
  if (nameOrEmail.includes("@")) {
    return nameOrEmail.split("@")[0].charAt(0).toUpperCase()
  }

  // Otherwise, get initials from name (up to 2 characters)
  return nameOrEmail
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

// Simple hash function to generate consistent results
function hashString(str: string): string {
  if (!str) return "default"

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}
