"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassSurface } from "@/components/ui/glass-surface"
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
import { AlertTriangle, CheckCircle, Clock, LifeBuoy, MessageSquare, RefreshCw, Search, Eye, FilterX, LoaderCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

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

function requesterName(ticket: Pick<SupportTicket, "requester">, t: any) {
  return ticket.requester?.name || ticket.requester?.phone || t('admin.unknownUser', "Unknown user")
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
  const { t } = useTranslation()
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
      [ticket.id, ticket.subject, ticket.description, ticket.category, requesterName(ticket, t), ticket.priority, ticket.status]
        .some((value) => String(value ?? "").toLowerCase().includes(query)),
    )
  }, [search, tickets, t])

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
      if (!metricsRes.ok) throw new Error(t('admin.failedLoadSupportMetrics', `Failed to load support metrics (${metricsRes.status})`))
      if (!ticketsRes.ok) throw new Error(t('admin.failedLoadSupportTickets', `Failed to load support tickets (${ticketsRes.status})`))
      setMetrics(await metricsRes.json())
      setTickets(await ticketsRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.failedLoadSupportCenter', "Failed to load support center"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [priorityFilter, statusFilter, t])

  useEffect(() => {
    void load()
  }, [load])

  async function openTicket(id: string) {
    setActionLoading(`open:${id}`)
    setError("")
    try {
      const response = await authedFetch(`/admin/support/tickets/${id}`)
      if (!response.ok) throw new Error(t('admin.failedLoadTicket', `Failed to load ticket (${response.status})`))
      setSelectedTicket(await response.json())
      setReply("")
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.failedLoadTicket', "Failed to load ticket"))
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
      if (!response.ok) throw new Error(t('admin.failedUpdateTicket', `Failed to update ticket (${response.status})`))
      await openTicket(selectedTicket.id)
      await load(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.failedUpdateTicket', "Failed to update ticket"))
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
      if (!response.ok) throw new Error(t('admin.failedSendReply', `Failed to send reply (${response.status})`))
      setReply("")
      await openTicket(selectedTicket.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.failedSendReply', "Failed to send reply"))
    } finally {
      setActionLoading("")
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <LifeBuoy className="h-6 w-6 text-primary" />
                  {t('admin.customerSupport', "Customer Support")}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('admin.customerSupportSubtitle', "Manage tickets, disputes, and support threads.")}
                </p>
              </div>
              <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
                <RefreshCw className={`me-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {t('admin.refresh', "Refresh")}
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <GlassSurface className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <LifeBuoy className="h-4 w-4" />
                {t('admin.openTickets', "Open Tickets")}
              </div>
              <div className="text-3xl font-semibold">
                {loading ? <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground/50" /> : metrics?.totalOpen ?? 0}
              </div>
            </GlassSurface>
            <GlassSurface className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                <AlertTriangle className="h-4 w-4" />
                {t('admin.urgent', "Urgent")}
              </div>
              <div className="text-3xl font-semibold text-destructive">
                {loading ? <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground/50" /> : metrics?.totalUrgent ?? 0}
              </div>
            </GlassSurface>
            <GlassSurface className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <CheckCircle className="h-4 w-4" />
                {t('admin.resolvedToday', "Resolved Today")}
              </div>
              <div className="text-3xl font-semibold">
                {loading ? <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground/50" /> : metrics?.resolvedToday ?? 0}
              </div>
            </GlassSurface>
            <GlassSurface className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                {t('admin.avgResolution', "Avg Resolution")}
              </div>
              <div className="text-3xl font-semibold">
                {loading ? <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground/50" /> : `${metrics?.averageResolutionTimeHours ?? 0}h`}
              </div>
            </GlassSurface>
          </div>

          <GlassSurface className="p-0 overflow-hidden">
            <div className="bg-primary/5 p-4 border-b border-primary/10 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight">{t('admin.tickets', "Tickets")}</h2>
                <div className="relative md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('admin.searchTickets', "Search tickets...")} className="ps-9 bg-background/50" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Button key={status} size="sm" variant={statusFilter === status ? "default" : "outline"} onClick={() => setStatusFilter(status)}>
                    {status}
                  </Button>
                ))}
                <span className="mx-1 h-8 border-s" />
                {priorityOptions.map((priority) => (
                  <Button key={priority} size="sm" variant={priorityFilter === priority ? "default" : "outline"} onClick={() => setPriorityFilter(priority)}>
                    {priority}
                  </Button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="border-b bg-muted/40 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t('admin.ticket', "Ticket")}</th>
                    <th className="px-4 py-3">{t('admin.requester', "Requester")}</th>
                    <th className="px-4 py-3">{t('admin.category', "Category")}</th>
                    <th className="px-4 py-3">{t('admin.priority', "Priority")}</th>
                    <th className="px-4 py-3">{t('admin.status', "Status")}</th>
                    <th className="px-4 py-3 text-end">{t('admin.action', "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-2 text-primary/50" />
                        <span className="font-bold uppercase tracking-widest text-xs">{t('admin.loadingTickets', "Loading tickets...")}</span>
                      </td>
                    </tr>
                  ) : filteredTickets.length ? (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b hover:bg-muted/30">
                        <td className="max-w-xs px-4 py-3">
                          <p className="truncate font-semibold">{ticket.subject}</p>
                          <p className="font-mono text-xs text-muted-foreground">{ticket.id.slice(0, 12)} · {new Date(ticket.createdAt).toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-3">{requesterName(ticket, t)}</td>
                        <td className="px-4 py-3">{ticket.category}</td>
                        <td className="px-4 py-3"><Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge></td>
                        <td className="px-4 py-3"><Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge></td>
                        <td className="px-4 py-3 text-end">
                          <Button size="sm" variant="outline" onClick={() => openTicket(ticket.id)} disabled={actionLoading === `open:${ticket.id}`}>
                            <Eye className="me-2 h-4 w-4" />
                            {t('admin.viewThread', "View Thread")}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        <FilterX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <span>{t('admin.noTicketsFound', "No tickets found.")}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassSurface>
          </div>
        </main>
      </div>

      <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl flex flex-col">
          {selectedTicket ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  {requesterName(selectedTicket, t)} · {selectedTicket.category} · {new Date(selectedTicket.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2 py-2">
                {(["OPEN", "PENDING", "RESOLVED", "CLOSED"] as TicketStatus[]).map((status) => (
                  <Button key={status} size="sm" variant={selectedTicket.status === status ? "default" : "outline"} onClick={() => updateStatus(status)} disabled={Boolean(actionLoading)}>
                    {status}
                  </Button>
                ))}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto rounded-md border p-3 min-h-[200px]">
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{t('admin.description', "Description")}</p>
                  <p className="mt-1 text-muted-foreground">{selectedTicket.description}</p>
                </div>
                {selectedTicket.messages.length ? selectedTicket.messages.map((message) => (
                  <div key={message.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{message.sender?.name || message.sender?.role || t('admin.support', "Support")}</p>
                      <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="mt-2 text-muted-foreground">{message.body}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">{t('admin.noMessagesYet', "No messages yet.")}</p>}
              </div>

              <form onSubmit={sendReply} className="space-y-2 pt-2">
                <Label htmlFor="reply">{t('admin.reply', "Reply")}</Label>
                <Input id="reply" value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t('admin.writeSupportReply', "Write a support reply...")} />
                <div className="flex justify-end">
                  <Button disabled={!reply.trim() || actionLoading === "reply"}>
                    <MessageSquare className="me-2 h-4 w-4" />
                    {t('admin.sendReply', "Send Reply")}
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