"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authedFetch } from "@/lib/auth"
import { AlertTriangle, CheckCircle, Clock, LifeBuoy, MessageSquare, RefreshCw, Search } from "lucide-react"

type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED"
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

type SupportMetrics = {
  totalOpen: number
  totalUrgent: number
  resolvedToday: number
  averageResolutionTimeHours: number
}

type SupportTicket = {
  id: string
  requesterId: string
  assigneeId?: string | null
  category: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  resolvedAt?: string | null
  requester?: { name?: string | null; phone?: string | null; role?: string | null }
  assignee?: { name?: string | null } | null
}

type TicketDetails = SupportTicket & {
  requester?: { id: string; name?: string | null; phone?: string | null; email?: string | null; role?: string | null; status?: string | null }
  assignee?: { id: string; name?: string | null } | null
  messages: Array<{
    id: string
    body: string
    createdAt: string
    sender?: { name?: string | null; role?: string | null }
  }>
}

const statusOptions: Array<"ALL" | TicketStatus> = ["ALL", "OPEN", "PENDING", "RESOLVED", "CLOSED"]
const priorityOptions: Array<"ALL" | TicketPriority> = ["ALL", "URGENT", "HIGH", "NORMAL", "LOW"]

function requesterName(ticket: Pick<SupportTicket, "requester">) {
  return ticket.requester?.name || ticket.requester?.phone || "Unknown user"
}

function priorityVariant(priority: TicketPriority) {
  return priority === "URGENT" || priority === "HIGH" ? "destructive" : "secondary"
}

function statusVariant(status: TicketStatus) {
  if (status === "OPEN") return "default"
  if (status === "RESOLVED" || status === "CLOSED") return "secondary"
  return "outline"
}

export default function SupportTicketsPage() {
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null)
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL")
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | TicketPriority>("ALL")
  const [search, setSearch] = useState("")
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState("")
  const [error, setError] = useState("")

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tickets
    return tickets.filter((ticket) =>
      [ticket.id, ticket.subject, ticket.description, ticket.category, requesterName(ticket), ticket.priority, ticket.status]
        .some((value) => String(value ?? "").toLowerCase().includes(query)),
    )
  }, [search, tickets])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter)

      const [metricsRes, ticketsRes] = await Promise.all([
        authedFetch("/admin/support/metrics"),
        authedFetch(`/admin/support/tickets?${params.toString()}`),
      ])
      if (!metricsRes.ok) throw new Error(`Failed to load support metrics (${metricsRes.status})`)
      if (!ticketsRes.ok) throw new Error(`Failed to load support tickets (${ticketsRes.status})`)
      setMetrics(await metricsRes.json())
      setTickets(await ticketsRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support center")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [priorityFilter, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  async function openTicket(id: string) {
    setActionLoading(`open:${id}`)
    setError("")
    try {
      const response = await authedFetch(`/admin/support/tickets/${id}`)
      if (!response.ok) throw new Error(`Failed to load ticket (${response.status})`)
      setSelectedTicket(await response.json())
      setReply("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket")
    } finally {
      setActionLoading("")
    }
  }

  async function updateStatus(status: TicketStatus) {
    if (!selectedTicket) return
    setActionLoading(`status:${status}`)
    setError("")
    try {
      const response = await authedFetch(`/admin/support/tickets/${selectedTicket.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error(`Failed to update ticket (${response.status})`)
      await openTicket(selectedTicket.id)
      await load(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ticket")
    } finally {
      setActionLoading("")
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTicket || !reply.trim()) return
    setActionLoading("reply")
    setError("")
    try {
      const response = await authedFetch(`/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: reply.trim() }),
      })
      if (!response.ok) throw new Error(`Failed to send reply (${response.status})`)
      setReply("")
      await openTicket(selectedTicket.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply")
    } finally {
      setActionLoading("")
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="flex min-h-screen flex-col bg-muted/20">
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <LifeBuoy className="h-6 w-6 text-primary" />
                  Customer Support
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage tickets, disputes, and support threads.
                </p>
              </div>
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <LifeBuoy className="h-4 w-4" />
                  Open Tickets
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-semibold">{loading ? "..." : metrics?.totalOpen ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Urgent
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-semibold text-destructive">{loading ? "..." : metrics?.totalUrgent ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  Resolved Today
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-semibold">{loading ? "..." : metrics?.resolvedToday ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Avg Resolution
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-semibold">{loading ? "..." : `${metrics?.averageResolutionTimeHours ?? 0}h`}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Tickets</CardTitle>
                <div className="relative md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets..." className="pl-9" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Button key={status} size="sm" variant={statusFilter === status ? "default" : "outline"} onClick={() => setStatusFilter(status)}>
                    {status}
                  </Button>
                ))}
                <span className="mx-1 h-8 border-l" />
                {priorityOptions.map((priority) => (
                  <Button key={priority} size="sm" variant={priorityFilter === priority ? "default" : "outline"} onClick={() => setPriorityFilter(priority)}>
                    {priority}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Ticket</th>
                      <th className="px-4 py-3">Requester</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading tickets...</td></tr>
                    ) : filteredTickets.length ? (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b hover:bg-muted/30">
                          <td className="max-w-xs px-4 py-3">
                            <p className="truncate font-semibold">{ticket.subject}</p>
                            <p className="font-mono text-xs text-muted-foreground">{ticket.id.slice(0, 12)} · {new Date(ticket.createdAt).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3">{requesterName(ticket)}</td>
                          <td className="px-4 py-3">{ticket.category}</td>
                          <td className="px-4 py-3"><Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge></td>
                          <td className="px-4 py-3"><Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="outline" onClick={() => openTicket(ticket.id)} disabled={actionLoading === `open:${ticket.id}`}>
                              View Thread
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No tickets found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
          {selectedTicket ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  {requesterName(selectedTicket)} · {selectedTicket.category} · {new Date(selectedTicket.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                {(["OPEN", "PENDING", "RESOLVED", "CLOSED"] as TicketStatus[]).map((status) => (
                  <Button key={status} size="sm" variant={selectedTicket.status === status ? "default" : "outline"} onClick={() => updateStatus(status)} disabled={Boolean(actionLoading)}>
                    {status}
                  </Button>
                ))}
              </div>

              <div className="max-h-[42vh] space-y-3 overflow-y-auto rounded-md border p-3">
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Description</p>
                  <p className="mt-1 text-muted-foreground">{selectedTicket.description}</p>
                </div>
                {selectedTicket.messages.length ? selectedTicket.messages.map((message) => (
                  <div key={message.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{message.sender?.name || message.sender?.role || "Support"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="mt-2 text-muted-foreground">{message.body}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No messages yet.</p>}
              </div>

              <form onSubmit={sendReply} className="space-y-2">
                <Label htmlFor="reply">Reply</Label>
                <Input id="reply" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a support reply..." />
                <div className="flex justify-end">
                  <Button disabled={!reply.trim() || actionLoading === "reply"}>
                    <MessageSquare className="h-4 w-4" />
                    Send Reply
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
