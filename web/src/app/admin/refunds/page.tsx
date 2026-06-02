"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Undo2, Check, X } from "lucide-react"

export default function RefundsPage() {
  const refunds = [
    { id: "REF-001", user: "Zahra S.", type: "Trip", amount: "150 AFN", reason: "Driver requested cash but I paid via wallet", status: "PENDING" },
    { id: "REF-002", user: "Karim", type: "Food Order", amount: "400 AFN", reason: "Order arrived completely ruined", status: "PENDING" },
    { id: "REF-003", user: "Ahmad", type: "Delivery", amount: "80 AFN", reason: "Delivery was 2 hours late", status: "APPROVED" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <Undo2 className="h-8 w-8 text-primary" />
              Refund Requests
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Review, approve, or reject customer refund requests manually.
            </BodyMd>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Request ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono text-xs">{r.id}</td>
                      <td className="px-6 py-4 font-bold">{r.user}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{r.type}</Badge></td>
                      <td className="px-6 py-4 font-bold text-gold">{r.amount}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs max-w-[200px] truncate">{r.reason}</td>
                      <td className="px-6 py-4">
                        <Badge variant={r.status === 'PENDING' ? 'secondary' : 'default'} className="text-[10px]">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white"><Check className="h-4 w-4 mr-1" /> Approve</Button>
                            <Button size="sm" variant="outline" className="h-8 text-red-500 hover:bg-red-500/10"><X className="h-4 w-4 mr-1" /> Reject</Button>
                          </div>
                        )}
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
