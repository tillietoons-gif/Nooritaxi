"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LifeBuoy, Check, Tag } from "lucide-react"

export default function SupportTicketsPage() {
  const tickets = [
    { id: "TCK-1049", user: "John Doe", subject: "Double charge on ride", priority: "HIGH", status: "OPEN", date: "10m ago" },
    { id: "TCK-1048", user: "Zahra Ahmadi", subject: "Driver was rude", priority: "NORMAL", status: "PENDING", date: "1h ago" },
    { id: "TCK-1047", user: "Restaurant Kabul", subject: "App crashed during order", priority: "URGENT", status: "OPEN", date: "2h ago" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <LifeBuoy className="h-8 w-8 text-primary" />
              Customer Support Center
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Manage tickets, disputes, and live chats for riders, drivers, and merchants.
            </BodyMd>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono text-xs">{t.id}</td>
                      <td className="px-6 py-4 font-bold">{t.user}</td>
                      <td className="px-6 py-4">{t.subject}</td>
                      <td className="px-6 py-4">
                        <Badge variant={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={t.status === 'OPEN' ? 'default' : 'outline'} className="text-[10px]">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="h-8">
                          View Thread
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  )
}
