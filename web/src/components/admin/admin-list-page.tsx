"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authedFetch } from "@/lib/auth"

export type AdminColumn<T> = {
  key: string
  header: string
  render: (row: T) => React.ReactNode
}

export type AdminListPageProps<T> = {
  title: string
  endpoint: string
  columns: AdminColumn<T>[]
  statusOptions?: string[]
  searchPlaceholder?: string
  rowHref?: (row: T) => string
  rowKey: (row: T) => string
}

type ApiResult<T> = { items: T[]; total: number; page: number; limit: number }

const PAGE_SIZE = 25

export function AdminListPage<T>({
  title,
  endpoint,
  columns,
  statusOptions,
  searchPlaceholder = "Search…",
  rowHref,
  rowKey,
}: AdminListPageProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>("")
  const [q, setQ] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${total.toLocaleString()} total`}
            </p>
          </div>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            ← Back to admin
          </Link>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Search</label>
              <Input
                placeholder={searchPlaceholder}
                value={q}
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
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setPage(1)
                    setStatus(e.target.value)
                  }}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              variant="outline"
              onClick={() => {
                setPage(1)
                setSearch(q)
              }}
              disabled={loading}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setQ("")
                setSearch("")
                setStatus("")
                setPage(1)
              }}
              disabled={loading}
            >
              Reset
            </Button>
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className="px-3 py-2 font-medium">
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        Loading…
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        No results.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const k = rowKey(row)
                      const inner = (
                        <>
                          {columns.map((c) => (
                            <td key={c.key} className="px-3 py-2 align-top">
                              {c.render(row)}
                            </td>
                          ))}
                        </>
                      )
                      return rowHref ? (
                        <tr
                          key={k}
                          className="cursor-pointer border-b hover:bg-muted/30"
                          onClick={() => {
                            window.location.href = rowHref(row)
                          }}
                        >
                          {inner}
                        </tr>
                      ) : (
                        <tr key={k} className="border-b">
                          {inner}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
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
