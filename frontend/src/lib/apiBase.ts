/**
 * The origin that documentation and code samples should point at.
 *
 * Every sample on the API page is a copy-paste starting point, so it has to
 * name the site the reader is actually on rather than the lab that happens to
 * host the reference deployment. Site Identity → Site URL wins; failing that,
 * wherever the page is being served from, which is right for anyone who never
 * set it.
 */
export function apiBase(url?: string | null): string {
  const configured = url?.trim()
  const base = configured || (typeof window === 'undefined' ? '' : window.location.origin)
  // Trailing slashes would double up against the `${base}/api/...` callers build.
  return base.replace(/\/+$/, '')
}
