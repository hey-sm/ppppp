export function normalizeUrl(rawUrl?: string | null) {
  const trimmed = (rawUrl ?? "").trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function getFaviconUrl(rawUrl?: string | null) {
  try {
    const normalized = normalizeUrl(rawUrl)
    if (!normalized) return ""
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
      normalized,
    )}`
  } catch {
    return ""
  }
}