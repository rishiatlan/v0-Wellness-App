// This is a standalone utility function that can be imported anywhere
// It doesn't import anything from server components

export function isAtlanEmail(email: string): boolean {
  return email.endsWith("@atlan.com")
}
