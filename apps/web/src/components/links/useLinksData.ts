import { useState } from "react"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/hooks/useSession"
import type { LinkRow, QueryData, LinkDraft } from "./types"

const QUERY_KEY = "links-page" as const

const emptyDraft: LinkDraft = { title: "", url: "", note: "" }

export function useLinksData() {
  const session = useSession()
  const queryClient = useQueryClient()

  const queryKey = [QUERY_KEY, session?.user.id ?? "anon"]

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, links(*)")
        .order("order_index")
        .order("created_at")
        .order("order_index", { referencedTable: "links" })
      if (error) throw new Error(error.message)
      return data as QueryData
    },
    placeholderData: keepPreviousData,
  })

  const categories = data?.map(({ links: _links, ...cat }) => cat) ?? []

  const linksByCategory = new Map<string, LinkRow[]>()
  for (const cat of data ?? []) {
    if (cat.links?.length) linksByCategory.set(cat.id, cat.links)
  }

  async function addCategory(userId: string, name: string) {
    const { data: inserted, error } = await supabase
      .from("categories")
      .insert({ name, user_id: userId, order_index: Date.now() })
      .select("*")
      .single()
    if (error) throw error
    if (inserted) {
      queryClient.setQueryData<QueryData>(queryKey, (old) => [
        ...(old ?? []),
        { ...inserted, links: [] },
      ])
    }
  }

  async function updateCategory(categoryId: string, name: string) {
    const { data: updated, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", categoryId)
      .select("*")
      .single()
    if (error) throw error
    if (updated) {
      queryClient.setQueryData<QueryData>(queryKey, (old) =>
        old?.map((cat) =>
          cat.id === categoryId ? { ...updated, links: cat.links } : cat,
        ) ?? [],
      )
    }
  }

  async function deleteCategory(categoryId: string) {
    const { error } = await supabase.from("categories").delete().eq("id", categoryId)
    if (error) throw error
    queryClient.setQueryData<QueryData>(queryKey, (old) =>
      old?.filter((cat) => cat.id !== categoryId) ?? [],
    )
  }

  async function addLink(userId: string, categoryId: string, draft: LinkDraft) {
    const { data: inserted, error } = await supabase
      .from("links")
      .insert({
        title: draft.title.trim(),
        url: draft.url.trim(),
        note: draft.note.trim() || null,
        user_id: userId,
        category_id: categoryId,
        order_index: Date.now(),
      })
      .select("*")
      .single()
    if (error) throw error
    if (inserted) {
      queryClient.setQueryData<QueryData>(queryKey, (old) =>
        old?.map((cat) =>
          cat.id === categoryId
            ? { ...cat, links: [...cat.links, inserted] }
            : cat,
        ) ?? [],
      )
    }
  }

  async function updateLink(
    linkId: string,
    draft: { title: string; url: string; note: string | null },
  ) {
    const note = (draft.note ?? "").trim()
    const { data: updated, error } = await supabase
      .from("links")
      .update({
        title: draft.title.trim(),
        url: draft.url.trim(),
        note: note || null,
      })
      .eq("id", linkId)
      .select("*")
      .single()
    if (error) throw error
    if (updated) {
      queryClient.setQueryData<QueryData>(queryKey, (old) =>
        old?.map((cat) => ({
          ...cat,
          links: cat.links.map((link) => (link.id === linkId ? updated : link)),
        })) ?? [],
      )
    }
  }

  async function deleteLink(linkId: string) {
    const { error } = await supabase.from("links").delete().eq("id", linkId)
    if (error) throw error
    queryClient.setQueryData<QueryData>(queryKey, (old) =>
      old?.map((cat) => ({
        ...cat,
        links: cat.links.filter((link) => link.id !== linkId),
      })) ?? [],
    )
  }

  return {
    categories,
    linksByCategory,
    isLoading,
    error,
    session,
    addCategory,
    updateCategory,
    deleteCategory,
    addLink,
    updateLink,
    deleteLink,
    emptyDraft,
  }
}

export function useDraftState() {
  const [newCategory, setNewCategory] = useState("")
  const [drafts, setDrafts] = useState<Record<string, LinkDraft>>({})
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({})
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [linkDrafts, setLinkDrafts] = useState<Record<string, LinkDraft>>({})

  const [mutationError, setMutationError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  return {
    newCategory,
    setNewCategory,
    drafts,
    setDrafts,
    editingCategoryId,
    setEditingCategoryId,
    categoryDrafts,
    setCategoryDrafts,
    editingLinkId,
    setEditingLinkId,
    linkDrafts,
    setLinkDrafts,
    mutationError,
    setMutationError,
    actionBusy,
    setActionBusy,
  }
}
