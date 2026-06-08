"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassSurface } from "@/components/ui/glass-surface"
import { authedFetch } from "@/lib/auth"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useTranslation } from "react-i18next"
import { FilterX, LoaderCircle, Search } from "lucide-react"

const PAGE_SIZE = 10

interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
}

interface AdminListPageProps<T> {
  title: string
  endpoint: string
  columns: Column<T>[]
  rowKey: (item: T) => string
  statusOptions?: string[]
  searchPlaceholder?: string
  rowHref?: (item: T) => string
}

type ApiResult<T> = {
  items: T[]
  total: number
}

export function AdminListPage<T>({
  title,
  endpoint,
  columns,
  rowKey,
  statusOptions,
  searchPlaceholder,
  rowHref,
}: AdminListPageProps<T>) {
  const { t } = useTranslation()
  const router = useRouter()
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [q, setQ] = useState("")
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const defaultSearchPlaceholder = searchPlaceholder || t("admin.search_placeholder", "Search...")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(PAGE_SIZE))
      if (status) params.set("status", status)
      if (search.trim()) params.set("q", search.trim())

      const response = await authedFetch(`${endpoint}?${params.toString()}`)
      if (!response.ok) throw new Error(`${endpoint} → ${response.status}`)
      const data = (await response.json()) as ApiResult<T> | T[]
      if (Array.isArray(data)) {
        setItems(data)
        setTotal(data.length)
      } else {
        setItems(data.items)
        setTotal(data.total)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.failed_to_load", "Failed to load"))
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, status, search, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void load()
    }

    window.addEventListener("pageshow", handlePageShow)
    return () => window.removeEventListener("pageshow", handlePageShow)
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="flex-1 px-4 py-8 md:px-8 relative overflow-hidden">
      <div className="mx-auto max-w-7xl space-y-6 relative z-10">
        <AdminPageHeader
          title={title}
          subtitle={
            loading ? t("admin.loading_records", "Loading records...") : `${t("admin.found", "Found")} ${total.toLocaleString()} ${t("admin.total_entries", "total entries")}`
          }
        />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassSurface variant="premium" className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
            <div className="flex-1 relative">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">{t("admin.search_query", "Search Query")}</label>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={defaultSearchPlaceholder}
                  value={q}
                  className="bg-background/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary ps-9"
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1)
                      setSearch(q)
                    }
                  }}
                />
              </div>
            </div>
            {statusOptions ? (
              <div className="w-full md:w-48">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">{t("admin.status_filter", "Status Filter")}</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setPage(1)
                    setStatus(e.target.value)
                  }}
                  className="block w-full rounded-md border border-primary/20 bg-background/80 backdrop-blur-sm px-3 py-2 h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary outline-none"
                >
                  <option value="">{t("admin.all_statuses", "All statuses")}</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <Button
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-10"
              onClick={() => {
                setPage(1)
                setSearch(q)
              }}
              disabled={loading}
            >
              {loading && <LoaderCircle className="me-2 h-4 w-4 animate-spin" />}
              {t("admin.apply_filters", "Apply Filters")}
            </Button>
            <Button
              variant="ghost"
              className="hover:bg-primary/10 text-muted-foreground hover:text-primary h-10"
              onClick={() => {
                setQ("")
                setSearch("")
                setStatus("")
                setPage(1)
              }}
              disabled={loading}
            >
              <FilterX className="me-2 h-4 w-4" />
              {t("admin.clear", "Clear")}
            </Button>
          </GlassSurface>
        </motion.div>

        {error ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive backdrop-blur-sm shadow-xl">
              {error}
            </div>
          </motion.div>
        ) : null}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassSurface className="p-0 overflow-hidden shadow-2xl rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-primary/5 text-primary border-b border-primary/10">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className="px-6 py-4 font-black uppercase tracking-wider text-xs text-start">
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {loading && items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-center text-muted-foreground font-medium"
                      >
                         <div className="flex flex-col items-center justify-center gap-3">
                           <LoaderCircle className="h-8 w-8 text-primary/50 animate-spin" />
                           <span>{t("admin.fetching_datastore", "Fetching datastore...")}</span>
                         </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-16 text-center text-muted-foreground font-medium"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                           <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-2">
                              <FilterX className="h-8 w-8 text-muted-foreground/50" />
                           </div>
                           <p className="text-lg">{t("admin.no_records_found", "No matching records found.")}</p>
                           <p className="text-sm opacity-70">{t("admin.try_clearing_filters", "Try adjusting or clearing your search filters.")}</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const k = rowKey(row)
                      const inner = (
                        <>
                          {columns.map((c) => (
                            <td key={c.key} className="px-6 py-4 align-middle whitespace-nowrap text-start">
                              {c.render(row)}
                            </td>
                          ))}
                        </>
                      )
                      return rowHref ? (
                        <tr
                          key={k}
                          className="cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => {
                            router.push(rowHref(row))
                          }}
                        >
                          {inner}
                        </tr>
                      ) : (
                        <tr key={k} className="hover:bg-primary/5 transition-colors">
                          {inner}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassSurface>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-between pt-4">
          <p className="text-sm font-bold text-muted-foreground">
            {t("admin.page", "Page")} <span className="text-foreground">{page}</span> {t("admin.of", "of")} <span className="text-foreground">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-primary/20 hover:bg-primary/10 hover:text-primary rounded-full px-5"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              {t("admin.previous", "Previous")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/20 hover:bg-primary/10 hover:text-primary rounded-full px-5"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("admin.next", "Next")}
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="secondary">—</Badge>
  const upper = status.toUpperCase()
  const tone =
    upper.includes("CANCEL") || upper.includes("FAIL") || upper === "REJECTED" || upper === "SUSPENDED"
      ? "destructive"
      : upper === "COMPLETED" || upper === "DELIVERED" || upper === "VERIFIED" || upper === "ACTIVE"
        ? "default"
        : "secondary"
  return <Badge variant={tone as "secondary" | "destructive" | "default"}>{status}</Badge>
}
