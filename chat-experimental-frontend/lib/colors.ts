// Pleasant, light colors for user messages
const USER_COLORS = [
  "#E6F3FF", // Light Blue
  "#FFE6EE", // Light Pink
  "#E6FFEA", // Light Green
  "#FFFDE6", // Light Yellow
  "#F3E6FF", // Light Purple
  "#E6FCFF", // Light Cyan
  "#FFF0E6", // Light Orange
  "#FFE6F6", // Light Rose
  "#E6F7FF", // Light Sky Blue
  "#F2FFE6", // Light Lime
] as const;

/**
 * Generates a consistent color for a username
 * @param username The username to generate a color for
 * @returns A hex color string
 */
export function getUserColor(username: string): string {
  let hash = 0;

  // Generate a hash from the username
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use the absolute value of the hash to pick a color
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
