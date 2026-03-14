import { useState } from "react"
import { Link as LinkIcon } from "lucide-react"
import { getFaviconUrl } from "./utils"

export function Favicon({ url, title }: { url?: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  const src = getFaviconUrl(url)
  return (
    <span className="relative flex size-5 items-center justify-center rounded bg-muted/40">
      {src && !failed ? (
        <img
          src={src}
          alt={title}
          className="size-4"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <LinkIcon className="size-3.5 text-muted-foreground" />
      )}
    </span>
  )
}