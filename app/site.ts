export function pageTitle(page: string) {
  return `${page} · Oripo`;
}

// Builds use the same origin for HTML metadata and the sitemap.
export function siteOrigin(value?: string) {
  const url = new URL(value || "http://127.0.0.1:4173");
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !(
      url.protocol === "https:" ||
      (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    )
  ) {
    throw new Error("ORIPO_SITE_URL must be an HTTPS origin or a loopback preview origin");
  }
  return url.origin;
}
