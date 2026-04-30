/**
 * Resolves a clinic logo URL to a full server URL if it's a relative path.
 * Handles both development and production environments.
 * 
 * @param url The logo URL from the database (could be relative, full, data, or null)
 * @param apiUrl The base API URL from environment
 * @param isProduction Whether the app is in production mode
 * @returns The resolved full URL or null
 */
export function getClinicLogoUrl(url: string | null | undefined, apiUrl: string, isProduction: boolean): string | null {
  if (!url) return null;
  
  // If it's already a full URL or data URI, return as is
  if (url.startsWith('data:') || url.startsWith('http')) return url;

  // Resolve base URL from apiUrl (remove /api/v1)
  let baseUrl = apiUrl.replace('/api/v1', '');

  // If baseUrl is empty or relative (e.g. just /api/v1), handle origins
  if (!baseUrl || !baseUrl.startsWith('http')) {
    if (!isProduction) {
      // In development, we know backend is usually on port 3000
      baseUrl = 'http://localhost:3000';
    } else {
      // In production, backend is on the same origin (if serving statically)
      baseUrl = window.location.origin;
    }
  }

  // Ensure no trailing slash in baseUrl and handle leading slash in url
  const base = baseUrl.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${base}${path}`;
}
