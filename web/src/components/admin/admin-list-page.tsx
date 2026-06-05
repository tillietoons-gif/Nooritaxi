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
  searchPlaceholder = "Search...",
  rowHref,
}: AdminListPageProps<T>) {
  const router = useRouter()
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [q, setQ] = useState("")
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, status, search])

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
            loading ? "Loading records..." : `Found ${total.toLocaleString()} total entries`
          }
        />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassSurface variant="premium" className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Search Query</label>
              <Input
                placeholder={searchPlaceholder}
                value={q}
                className="bg-background/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1)
                    setSearch(q)
                  }
                }}
              />
            </div>
            {statusOptions ? (
              <div className="w-full md:w-48">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Status Filter</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setPage(1)
                    setStatus(e.target.value)
                  }}
                  className="block w-full rounded-md border border-primary/20 bg-background/80 backdrop-blur-sm px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-primary outline-none"
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <Button
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              onClick={() => {
                setPage(1)
                setSearch(q)
              }}
              disabled={loading}
            >
              Apply Filters
            </Button>
            <Button
              variant="ghost"
              className="hover:bg-primary/10 text-muted-foreground hover:text-primary"
              onClick={() => {
                setQ("")
                setSearch("")
                setStatus("")
                setPage(1)
              }}
              disabled={loading}
            >
              Clear
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
          <GlassSurface className="p-0 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-primary/5 text-primary border-b border-primary/10">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className="px-6 py-4 font-black uppercase tracking-wider text-xs">
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
                        className="px-6 py-12 text-center text-muted-foreground animate-pulse font-medium"
                      >
                        Fetching datastore...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-center text-muted-foreground font-medium"
                      >
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const k = rowKey(row)
                      const inner = (
                        <>
                          {columns.map((c) => (
                            <td key={c.key} className="px-6 py-4 align-middle whitespace-nowrap">
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
            Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-primary/20 hover:bg-primary/10 hover:text-primary"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/20 hover:bg-primary/10 hover:text-primary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
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
    upper.includes("CANCEL") || upper.includes("FAIL") || upper === "REJECTED"
      ? "destructive"
      : upper === "COMPLETED" || upper === "DELIVERED" || upper === "VERIFIED" || upper === "ACTIVE"
        ? "default"
        : "secondary"
  return <Badge variant={tone as "secondary" | "destructive" | "default"}>{status}</Badge>
}
