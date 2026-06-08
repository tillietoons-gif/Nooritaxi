"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { authedFetch } from "@/lib/auth"
import { AlertCircle, FileText, LoaderCircle, Pencil, Plus, RefreshCw, Search } from "lucide-react"

type ContentType = "PAGE" | "FAQ" | "HELP_ARTICLE" | "TERMS" | "PRIVACY"

type ContentItem = {
  id: string
  slug: string
  title: string
  body: string
  type: ContentType
  locale: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  author?: { name?: string | null } | null
}

type ContentForm = {
  title: string
  slug: string
  type: ContentType
  locale: string
  body: string
  isPublished: boolean
}

const EMPTY_FORM: ContentForm = {
  title: "",
  slug: "",
  type: "PAGE",
  locale: "en",
  body: "",
  isPublished: false,
}

const contentTypes: Array<"ALL" | ContentType> = ["ALL", "PAGE", "FAQ", "HELP_ARTICLE", "TERMS", "PRIVACY"]

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(payload.message)) return payload.message.join(", ")
    if (payload.message) return payload.message
  } catch {
    // Ignore invalid JSON responses.
  }

  return `Request failed with ${response.status}`
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .replace(/^\/+/, "")
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

function slugFromTitle(title: string) {
  return normalizeSlug(title) || "untitled-page"
}

function displaySlug(slug: string) {
  return `/${slug.replace(/^\/+/, "")}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function CMSPage() {
  const [pages, setPages] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"ALL" | ContentType>("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [form, setForm] = useState<ContentForm>(EMPTY_FORM)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError(null)
    try {
      const response = await authedFetch("/admin/cms")
      if (!response.ok) throw new Error(await getErrorMessage(response))

      const payload = (await response.json()) as ContentItem[]
      setPages(Array.isArray(payload) ? payload : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CMS content")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return pages.filter((page) => {
      const matchesType = typeFilter === "ALL" || page.type === typeFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        page.title.toLowerCase().includes(normalizedQuery) ||
        page.slug.toLowerCase().includes(normalizedQuery) ||
        page.type.toLowerCase().includes(normalizedQuery) ||
        page.locale.toLowerCase().includes(normalizedQuery)

      return matchesType && matchesQuery
    })
  }, [pages, query, typeFilter])

  const publishedCount = useMemo(
    () => pages.filter((page) => page.isPublished).length,
    [pages],
  )

  function openCreateDialog() {
    setEditingSlug(null)
    setForm(EMPTY_FORM)
    setSubmitError(null)
    setDialogOpen(true)
  }

  function openEditDialog(page: ContentItem) {
    setEditingSlug(page.slug)
    setForm({
      title: page.title,
      slug: page.slug,
      type: page.type,
      locale: page.locale,
      body: page.body,
      isPublished: page.isPublished,
    })
    setSubmitError(null)
    setDialogOpen(true)
  }

  function closeDialog(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditingSlug(null)
      setForm(EMPTY_FORM)
      setSubmitError(null)
    }
  }

  async function savePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = form.title.trim()
    const slug = normalizeSlug(form.slug || slugFromTitle(title))
    const locale = form.locale.trim() || "en"
    const body = form.body.trim()

    if (!title) {
      setSubmitError("Title is required")
      return
    }

    if (!slug) {
      setSubmitError("Slug is required")
      return
    }

    if (!body) {
      setSubmitError("Body content is required")
      return
    }

    setSaving(true)
    setSubmitError(null)
    try {
      const response = await authedFetch(editingSlug ? `/admin/cms/${encodeURIComponent(editingSlug)}` : "/admin/cms", {
        method: editingSlug ? "PUT" : "POST",
        body: JSON.stringify({
          title,
          slug,
          type: form.type,
          locale,
          body,
          isPublished: form.isPublished,
        }),
      })

      if (!response.ok) throw new Error(await getErrorMessage(response))

      closeDialog(false)
      await loadData(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save content")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <HeadingLg className="mb-2 flex items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  Content Management System
                </HeadingLg>
                <BodyMd className="text-muted-foreground">
                  Manage legal pages, help articles, FAQs, and app content from live CMS records.
                </BodyMd>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => void loadData(true)} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button className="gap-2 rounded-full bg-primary font-bold text-white hover:bg-primary/90" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" /> Create Page
                </Button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Content Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{loading ? "..." : pages.length.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{loading ? "..." : publishedCount.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{loading ? "..." : (pages.length - publishedCount).toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-premium">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Content Library</CardTitle>
                  <div className="relative md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search content..." className="pl-9" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => (
                    <Button key={type} size="sm" variant={typeFilter === type ? "default" : "outline"} onClick={() => setTypeFilter(type)}>
                      {type}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                    <LoaderCircle className="h-5 w-5 animate-spin" /> Loading CMS content...
                  </div>
                ) : filteredPages.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h2 className="text-lg font-bold">No content found</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      Create the first CMS item or adjust the current filters.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Slug</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Locale</th>
                          <th className="px-6 py-4">Last Updated</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPages.map((page) => (
                          <tr key={page.id} className="border-b transition hover:bg-muted/20">
                            <td className="px-6 py-4">
                              <div className="font-bold">{page.title}</div>
                              <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                                {page.body}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-primary">{displaySlug(page.slug)}</td>
                            <td className="px-6 py-4"><Badge variant="outline">{page.type}</Badge></td>
                            <td className="px-6 py-4 text-xs uppercase text-muted-foreground">{page.locale}</td>
                            <td className="px-6 py-4 text-xs text-muted-foreground">{formatDate(page.updatedAt)}</td>
                            <td className="px-6 py-4">
                              <Badge variant={page.isPublished ? "default" : "secondary"} className="text-[10px]">
                                {page.isPublished ? "PUBLISHED" : "DRAFT"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button size="sm" variant="outline" className="h-8" onClick={() => openEditDialog(page)}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={savePage} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingSlug ? "Edit CMS content" : "Create CMS content"}</DialogTitle>
              <DialogDescription>
                Publish legal, help, and app content from the CMS backend.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cms-title">Title</Label>
                <Input id="cms-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cms-slug">Slug</Label>
                <Input
                  id="cms-slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder={form.title ? slugFromTitle(form.title) : "terms"}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cms-type">Type</Label>
                <select
                  id="cms-type"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ContentType }))}
                  disabled={saving}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="PAGE">Page</option>
                  <option value="FAQ">FAQ</option>
                  <option value="HELP_ARTICLE">Help article</option>
                  <option value="TERMS">Terms</option>
                  <option value="PRIVACY">Privacy</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cms-locale">Locale</Label>
                <Input id="cms-locale" value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} disabled={saving} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-body">Body</Label>
              <textarea
                id="cms-body"
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                disabled={saving}
                className="min-h-56 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
                disabled={saving}
                className="h-4 w-4 rounded border-primary/30"
              />
              Published
            </label>

            {submitError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {submitError}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingSlug ? "Save Content" : "Create Content"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
