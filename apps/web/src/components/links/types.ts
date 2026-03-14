export type CategoryRow = {
  id: string
  user_id: string
  name: string
  order_index: number
  created_at: string
  updated_at: string | null
}

export type LinkRow = {
  id: string
  user_id: string
  category_id: string
  title: string
  url: string
  note: string | null
  order_index: number
  created_at: string
  updated_at: string | null
}

export type LinkDraft = {
  title: string
  url: string
  note: string
}

export type QueryData = (CategoryRow & { links: LinkRow[] })[]