// Generate consistent avatars based on user/team IDs or names
export function getAvatarUrl(identifier: string, type: "user" | "team" = "user"): string {
  // Hash the identifier to get a consistent seed
  const seed = hashString(identifier)

  if (type === "user") {
    // Use DiceBear Avatars for users - adventurer style
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  } else {
    // Use DiceBear Avatars for teams - shapes style
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=0077b6,0096c7,00b4d8,48cae4,90e0ef`
  }
}

// Simple hash function to convert string to a numeric seed
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Make sure it's positive and return as string
  return Math.abs(hash).toString()
}

// Get initials from name or email
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"

  // If it's an email, get the first character before @
  if (name.includes("@")) {
    return name.split("@")[0].charAt(0).toUpperCase()
  }

  // Otherwise get first character of each word, up to 2 characters
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}
