/**
 * Utility for constructing image URLs
 * Handles both absolute URLs and relative paths
 */

export const getImageUrl = (photoPath) => {
  if (!photoPath) return null;
  
  // If already an absolute URL, return as-is
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  
  // Base server URL (not API URL)
  const baseUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  
  // If path starts with /, just append it
  if (photoPath.startsWith('/')) {
    return `${baseUrl}${photoPath}`;
  }
  
  // Otherwise, prepend /uploads/
  return `${baseUrl}/uploads/${photoPath}`;
};

/**
 * Handle image load errors gracefully
 */
export const handleImageError = (e, fallbackDisplay = 'none') => {
  console.warn('Image failed to load:', e.target.src);
  e.target.style.display = fallbackDisplay;
  
  // Try to show next sibling as fallback (usually a placeholder)
  if (e.target.nextSibling && e.target.nextSibling.style) {
    e.target.nextSibling.style.display = 'flex';
  }
};
