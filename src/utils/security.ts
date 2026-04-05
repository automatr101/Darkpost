/**
 * SECURITY UTILITIES
 * 
 * Centralized sanitization and security logic to prevent XSS 
 * and avoid ESM/CJS build-time dependency issues.
 */

/**
 * Strips all HTML tags from a string using a robust regex.
 * Use this as a lightweight, bundle-friendly alternative to DOMPurify.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Validates if a string contains non-whitespace characters.
 */
export function isValidContent(content: string): boolean {
  return !!content && content.trim().length > 0;
}
