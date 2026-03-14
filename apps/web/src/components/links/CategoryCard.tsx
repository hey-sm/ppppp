import type { LinkRow, LinkDraft, CategoryRow } from "./types"
import { Favicon } from "./Favicon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Pencil, Trash2, X, Plus } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type CategoryCardProps = {
  category: CategoryRow
  links: LinkRow[]
  canEdit: boolean
  editingCategoryId: string | null
  categoryDrafts: Record<string, string>
  editingLinkId: string | null
  linkDrafts: Record<string, LinkDraft>
  drafts: Record<string, LinkDraft>
  actionBusy: string | null
  onStartEditCategory: (cat: CategoryRow) => void
  onCancelEditCategory: () => void
  onUpdateCategory: (id: string) => void
  onDeleteCategory: (id: string) => void
  onStartEditLink: (link: LinkRow) => void
  onCancelEditLink: () => void
  onUpdateLink: (id: string) => void
  onDeleteLink: (id: string) => void
  onAddLink: (categoryId: string) => void
  onUpdateCategoryDraft: (id: string, name: string) => void
  onUpdateLinkDraft: (id: string, patch: Partial<LinkDraft>) => void
  onUpdateDraft: (categoryId: string, patch: Partial<LinkDraft>) => void
}

export function CategoryCard({
  category,
  links,
  canEdit,
  editingCategoryId,
  categoryDrafts,
  editingLinkId,
  linkDrafts,
  drafts,
  actionBusy,
  onStartEditCategory,
  onCancelEditCategory,
  onUpdateCategory,
  onDeleteCategory,
  onStartEditLink,
  onCancelEditLink,
  onUpdateLink,
  onDeleteLink,
  onAddLink,
  onUpdateCategoryDraft,
  onUpdateLinkDraft,
  onUpdateDraft,
}: CategoryCardProps) {
  const isEditingCategory = editingCategoryId === category.id
  const categoryDraft = categoryDrafts[category.id] ?? category.name
  const draft = drafts[category.id] ?? { title: "", url: "", note: "" }

  return (
    <Card className="gap-4">
      <CardHeader className="border-b pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditingCategory ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={categoryDraft}
                  onChange={(e) => onUpdateCategoryDraft(category.id, e.target.value)}
                  className="h-8 min-w-[200px] max-w-[280px]"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  onClick={() => onUpdateCategory(category.id)}
                  disabled={actionBusy === `update-category:${category.id}`}
                  aria-label="保存分类"
                >
                  <Check />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCancelEditCategory}
                  aria-label="取消编辑"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <>
                <CardTitle className="truncate">{category.name}</CardTitle>
                <CardDescription>
                  {links.length ? `${links.length} 个链接` : "暂无链接"}
                </CardDescription>
              </>
            )}
          </div>
          {canEdit ? (
            <CardAction className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onStartEditCategory(category)}
                aria-label="编辑分类"
                disabled={isEditingCategory}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onDeleteCategory(category.id)}
                disabled={actionBusy === `delete-category:${category.id}`}
                aria-label="删除分类"
              >
                <Trash2 />
              </Button>
            </CardAction>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {links.map((link) => {
            const editDraft: LinkDraft = linkDrafts[link.id] ?? {
              title: link.title,
              url: link.url,
              note: link.note ?? "",
            }
            const isEditingLink = editingLinkId === link.id
            return (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                {isEditingLink ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      onUpdateLink(link.id)
                    }}
                    className="flex w-full flex-wrap items-center gap-2"
                  >
                    <div className="flex min-w-[180px] flex-1 items-center gap-2">
                      <Favicon url={editDraft.url} title={link.title} />
                      <Input
                        value={editDraft.title}
                        onChange={(e) =>
                          onUpdateLinkDraft(link.id, { title: e.target.value })
                        }
                        className="h-8"
                      />
                    </div>
                    <Input
                      value={editDraft.url}
                      onChange={(e) =>
                        onUpdateLinkDraft(link.id, { url: e.target.value })
                      }
                      className="h-8 min-w-[200px] flex-1"
                    />
                    <Input
                      value={editDraft.note}
                      onChange={(e) =>
                        onUpdateLinkDraft(link.id, { note: e.target.value })
                      }
                      className="h-8 min-w-[120px] flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        type="submit"
                        size="icon-sm"
                        disabled={actionBusy === `update-link:${link.id}`}
                        aria-label="保存链接"
                      >
                        <Check />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={onCancelEditLink}
                        aria-label="取消编辑"
                      >
                        <X />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        <Favicon url={link.url} title={link.title} />
                        <span className="truncate">{link.title}</span>
                      </a>
                      <div className="truncate text-xs text-muted-foreground">
                        {link.url}
                      </div>
                      {link.note ? (
                        <div className="text-xs text-muted-foreground">{link.note}</div>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onStartEditLink(link)}
                          aria-label="编辑链接"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDeleteLink(link.id)}
                          disabled={actionBusy === `delete-link:${link.id}`}
                          aria-label="删除链接"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {canEdit ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onAddLink(category.id)
            }}
            className="rounded-lg border bg-muted/20 p-3"
          >
            <div className="grid gap-2 sm:grid-cols-6">
              <Input
                placeholder="标题"
                value={draft.title}
                onChange={(e) => onUpdateDraft(category.id, { title: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                placeholder="https://example.com"
                value={draft.url}
                onChange={(e) => onUpdateDraft(category.id, { url: e.target.value })}
                className="sm:col-span-3"
              />
              <Input
                placeholder="备注"
                value={draft.note}
                onChange={(e) => onUpdateDraft(category.id, { note: e.target.value })}
                className="sm:col-span-1"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={actionBusy === `add-link:${category.id}`}
              >
                <Plus />
                添加链接
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}