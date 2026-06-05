"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
} from "lucide-react"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { authedFetch } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED"
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

type SupportTicket = {
  id: string
  subject: string
  description: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  createdAt: string
  requester?: { name?: string | null; phone?: string | null; role?: string } | null
  messages: {
    id: string
    body: string
    createdAt: string
    sender?: { name?: string | null; role?: string } | null
  }[]
}

type SupportMetrics = {
  totalOpen: number
  totalUrgent: number
  resolvedToday: number
  averageResolutionTimeHours: number
}

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL")
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL")
  const [reply, setReply] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState("")

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const [tkRes, mtRes] = await Promise.all([
        authedFetch("/admin/support/tickets?limit=100"),
        authedFetch("/admin/support/metrics")
      ])

      if (tkRes.ok) setTickets(await tkRes.json())
      if (mtRes.ok) setMetrics(await mtRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch =
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.requester?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.requester?.phone?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter
      const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, statusFilter, priorityFilter])

  const openTicket = async (id: string) => {
    setActionLoading(`open:${id}`)
    try {
      const res = await authedFetch(`/admin/support/tickets/${id}`)
      if (res.ok) setSelectedTicket(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket details")
    } finally {
      setActionLoading("")
    }
  }

  const updateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return
    setActionLoading("status")
    try {
      const res = await authedFetch(`/admin/support/tickets/${selectedTicket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null)
        await load(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setActionLoading("")
    }
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !reply.trim()) return
    setActionLoading("reply")
    try {
      const response = await authedFetch(`/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: reply.trim() }),
      })
      if (!response.ok) throw new Error("Failed to send reply")
      setReply("")
      await openTicket(selectedTicket.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply")
    } finally {
      setActionLoading("")
    }
  }

  const priorityVariant = (p: TicketPriority) => {
    if (p === "URGENT") return "destructive"
    if (p === "HIGH") return "destructive"
    return "secondary"
  }

  const statusVariant = (s: TicketStatus) => {
    if (s === "RESOLVED" || s === "CLOSED") return "default"
    return "secondary"
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Customer Support"
            subtitle="Manage tickets, disputes, and support threads."
            actions={
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            }
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                  <LifeBuoy className="h-4 w-4" /> Open Tickets
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-black">{loading ? "..." : metrics?.totalOpen ?? 0}</div></CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Urgent
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-black text-destructive">{loading ? "..." : metrics?.totalUrgent ?? 0}</div></CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                  <CheckCircle className="h-4 w-4" /> Resolved Today
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-black">{loading ? "..." : metrics?.resolvedToday ?? 0}</div></CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                  <Clock className="h-4 w-4" /> Avg Resolution
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-black">{loading ? "..." : `${metrics?.averageResolutionTimeHours ?? 0}h`}</div></CardContent>
            </Card>
          </div>

          <Card className="border-primary/10 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Support Tickets</CardTitle>
                <div className="relative md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-9 bg-background/50" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "OPEN", "PENDING", "RESOLVED", "CLOSED"] as const).map((s) => (
                  <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="text-[10px] font-bold uppercase tracking-widest">
                    {s}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-primary/10 bg-background/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-black">Ticket</th>
                      <th className="px-6 py-4 font-black">Requester</th>
                      <th className="px-6 py-4 font-black">Category</th>
                      <th className="px-6 py-4 font-black">Priority</th>
                      <th className="px-6 py-4 font-black">Status</th>
                      <th className="px-6 py-4 text-right font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse font-medium">Scanning support database...</td></tr>
                    ) : filteredTickets.length ? (
                      filteredTickets.map((t) => (
                        <tr key={t.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                          <td className="max-w-xs px-6 py-4">
                            <p className="truncate font-bold">{t.subject}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{t.id.slice(-12)} · {new Date(t.createdAt).toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-xs">{t.requester?.name ?? t.requester?.phone ?? "Unknown"}</td>
                          <td className="px-6 py-4 text-xs">{t.category}</td>
                          <td className="px-6 py-4"><Badge variant={priorityVariant(t.priority)} className="text-[10px]">{t.priority}</Badge></td>
                          <td className="px-6 py-4"><Badge variant={statusVariant(t.status)} className="text-[10px]">{t.status}</Badge></td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => openTicket(t.id)} className="border-primary/20 hover:bg-primary/10 text-primary">View</Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No support tickets found matching criteria.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
          {selectedTicket ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  {selectedTicket.requester?.name || selectedTicket.requester?.phone} · {selectedTicket.category} · {new Date(selectedTicket.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2 py-2">
                {(["OPEN", "PENDING", "RESOLVED", "CLOSED"] as TicketStatus[]).map((status) => (
                  <Button key={status} size="sm" variant={selectedTicket.status === status ? "default" : "outline"} onClick={() => updateStatus(status)} disabled={Boolean(actionLoading)} className="text-[10px] font-black uppercase">
                    {status}
                  </Button>
                ))}
              </div>

              <div className="max-h-[42vh] space-y-4 overflow-y-auto rounded-xl border border-primary/10 bg-primary/5 p-4">
                <div className="rounded-lg bg-background p-3 text-sm border border-primary/5 shadow-sm">
                  <p className="font-bold text-xs uppercase text-primary tracking-widest mb-1">Description</p>
                  <p className="text-muted-foreground leading-relaxed">{selectedTicket.description}</p>
                </div>
                {selectedTicket.messages.map((m) => (
                  <div key={m.id} className="rounded-lg border border-primary/5 bg-background p-3 text-sm shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-bold text-xs uppercase tracking-widest">{m.sender?.name || m.sender?.role || "System"}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{m.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={sendReply} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="reply" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Internal / External Reply</Label>
                  <Input id="reply" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your response..." className="bg-muted/50" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button disabled={!reply.trim() || Boolean(actionLoading)} className="font-bold">
                    <MessageSquare className="mr-2 h-4 w-4" /> Send Reply
                  </Button>
                </div>
              </form>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AuthGate>
  )
}
