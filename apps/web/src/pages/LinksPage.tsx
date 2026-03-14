import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bookmark, FolderPlus } from "lucide-react"
import { LinksSkeleton } from "@/components/links/LinksSkeleton"
import { CategoryCard } from "@/components/links/CategoryCard"
import { useLinksData, useDraftState } from "@/components/links/useLinksData"
import { LoginPopover, UserBadge } from "@/components/links/AuthPanel"

export function LinksPage() {
  const {
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
  } = useLinksData()

  const {
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
  } = useDraftState()

  const [actionBusyLocal, setActionBusyLocal] = useState<string | null>(null)

  const canEdit = Boolean(session)
  const displayError = error?.message ?? mutationError

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !newCategory.trim()) return
    setActionBusy("add-category")
    setMutationError(null)
    try {
      await addCategory(session.user.id, newCategory.trim())
      setNewCategory("")
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "添加失败")
    }
    setActionBusy(null)
  }

  async function handleSignOut() {
    setActionBusyLocal("sign-out")
    await supabase.auth.signOut()
    setActionBusyLocal(null)
  }

  function startEditCategory(category: { id: string; name: string }) {
    setEditingCategoryId(category.id)
    setCategoryDrafts((prev) => ({ ...prev, [category.id]: category.name }))
  }

  function cancelEditCategory() {
    setEditingCategoryId(null)
  }

  async function handleUpdateCategory(categoryId: string) {
    const name = (categoryDrafts[categoryId] ?? "").trim()
    if (!name) return
    setActionBusy(`update-category:${categoryId}`)
    setMutationError(null)
    try {
      await updateCategory(categoryId, name)
      setEditingCategoryId(null)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "更新失败")
    }
    setActionBusy(null)
  }

  async function handleDeleteCategory(categoryId: string) {
    setActionBusy(`delete-category:${categoryId}`)
    setMutationError(null)
    try {
      await deleteCategory(categoryId)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "删除失败")
    }
    setActionBusy(null)
  }

  function startEditLink(link: { id: string; title: string; url: string; note: string | null }) {
    setEditingLinkId(link.id)
    setLinkDrafts((prev) => ({
      ...prev,
      [link.id]: { title: link.title, url: link.url, note: link.note ?? "" },
    }))
  }

  function cancelEditLink() {
    setEditingLinkId(null)
  }

  function updateLinkDraft(linkId: string, patch: { title?: string; url?: string; note?: string }) {
    setLinkDrafts((prev) => ({
      ...prev,
      [linkId]: { ...(prev[linkId] ?? emptyDraft), ...patch },
    }))
  }

  async function handleUpdateLink(linkId: string) {
    const draft = linkDrafts[linkId]
    if (!draft?.title.trim() || !draft.url.trim()) return
    setActionBusy(`update-link:${linkId}`)
    setMutationError(null)
    try {
      await updateLink(linkId, { title: draft.title.trim(), url: draft.url.trim(), note: draft.note.trim() || null })
      setEditingLinkId(null)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "更新失败")
    }
    setActionBusy(null)
  }

  async function handleDeleteLink(linkId: string) {
    setActionBusy(`delete-link:${linkId}`)
    setMutationError(null)
    try {
      await deleteLink(linkId)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "删除失败")
    }
    setActionBusy(null)
  }

  function updateDraft(categoryId: string, patch: { title?: string; url?: string; note?: string }) {
    setDrafts((prev) => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] ?? emptyDraft), ...patch },
    }))
  }

  async function handleAddLink(categoryId: string) {
    if (!session) return
    const draft = drafts[categoryId] ?? emptyDraft
    const title = draft.title.trim()
    const url = draft.url.trim()
    const note = draft.note.trim()
    if (!title || !url) return

    setActionBusy(`add-link:${categoryId}`)
    setMutationError(null)
    try {
      await addLink(session.user.id, categoryId, { title, url, note: note || null })
      setDrafts((prev) => ({ ...prev, [categoryId]: emptyDraft }))
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "添加失败")
    }
    setActionBusy(null)
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-55 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bookmark className="size-4" />
              <span className="text-xs uppercase tracking-widest">Links</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Some links</h1>
          </div>

          <div className="ml-auto flex w-full max-w-md items-end justify-end">
            {session ? (
              <UserBadge
                email={session.user.email}
                onSignOut={handleSignOut}
                busy={actionBusyLocal === "sign-out"}
              />
            ) : (
              <LoginPopover />
            )}
          </div>
        </div>

        {displayError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm">
            {displayError}
          </div>
        ) : null}

        {canEdit ? (
          <form onSubmit={handleAddCategory} className="flex flex-wrap gap-2">
            <Input
              placeholder="新增分类名称"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="min-w-[220px] flex-1"
            />
            <Button type="submit" disabled={actionBusy === "add-category"}>
              <FolderPlus />
              新增分类
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground">
            登录后可新增分类和网址
          </div>
        )}

        {isLoading ? (
          <LinksSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories.length === 0 ? (
              <div className="rounded-xl border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
                还没有分类，先创建一个吧
              </div>
            ) : null}

            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                links={linksByCategory.get(category.id) ?? []}
                canEdit={canEdit}
                editingCategoryId={editingCategoryId}
                categoryDrafts={categoryDrafts}
                editingLinkId={editingLinkId}
                linkDrafts={linkDrafts}
                drafts={drafts}
                actionBusy={actionBusy}
                onStartEditCategory={startEditCategory}
                onCancelEditCategory={cancelEditCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onStartEditLink={startEditLink}
                onCancelEditLink={cancelEditLink}
                onUpdateLink={handleUpdateLink}
                onDeleteLink={handleDeleteLink}
                onAddLink={handleAddLink}
                onUpdateCategoryDraft={(id, name) =>
                  setCategoryDrafts((prev) => ({ ...prev, [id]: name }))
                }
                onUpdateLinkDraft={updateLinkDraft}
                onUpdateDraft={updateDraft}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}