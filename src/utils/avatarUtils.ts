// Array of colors for profile pictures
const avatarColors = [
  '#60A5FA', // blue
  '#34D399', // green
  '#FBBF24', // yellow
  '#F87171', // red
  '#A78BFA', // purple
  '#FB7185', // pink
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
];

// Function to get initials from a name or number
function getInitials(text: string): string {
  if (!text) return '??';
  
  // If it's a phone number, return the last 2 digits
  if (/^\d+$/.test(text)) {
    return text.slice(-2);
  }
  
  // If it's a name, get the first letter of each word
  const words = text.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  
  return words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
}

// Function to get a consistent color based on text
function getColorFromText(text: string): string {
  if (!text) return avatarColors[0];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

// Main function to get profile props
export function getProfileProps(text: string): { initials: string; bgColor: string } {
  return {
    initials: getInitials(text),
    bgColor: getColorFromText(text)
  };
}