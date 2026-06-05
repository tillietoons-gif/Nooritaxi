"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Check, X, Clock } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function FleetPayoutsPage() {
  const payouts = [
    { id: "PAY-101", fleet: "Kabul Rapid Transit", amount: "120,000 AFN", method: "Bank Transfer", status: "PENDING", date: "2 hours ago" },
    { id: "PAY-100", fleet: "Herat Mobility Solutions", amount: "45,000 AFN", method: "Mobile Money", status: "PENDING", date: "5 hours ago" },
    { id: "PAY-099", fleet: "Kabul Rapid Transit", amount: "80,000 AFN", method: "Bank Transfer", status: "COMPLETED", date: "2 days ago" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Fleet Payouts"
            subtitle="Review and approve withdrawal requests from Fleet owners."
          />

          <Card className="border-primary/10 shadow-2xl overflow-hidden glass-premium">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Fleet Name</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(p => (
                      <tr key={p.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground">{p.id}</td>
                        <td className="px-6 py-4 font-bold tracking-tight">{p.fleet}</td>
                        <td className="px-6 py-4 font-black text-gold">{p.amount}</td>
                        <td className="px-6 py-4 text-xs">{p.method}</td>
                        <td className="px-6 py-4">
                          <Badge variant={p.status === 'PENDING' ? 'secondary' : 'default'} className="text-[10px] gap-1">
                            {p.status === 'PENDING' ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === 'PENDING' && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">Approve</Button>
                              <Button size="sm" variant="outline" className="font-bold border-destructive/20 text-destructive hover:bg-destructive/10">Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGate>
  )
}
