"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Check, X, Clock } from "lucide-react"

export default function FleetPayoutsPage() {
  const payouts = [
    { id: "PAY-101", fleet: "Kabul Rapid Transit", amount: "120,000 AFN", method: "Bank Transfer", status: "PENDING", date: "2 hours ago" },
    { id: "PAY-100", fleet: "Herat Mobility Solutions", amount: "45,000 AFN", method: "Mobile Money", status: "PENDING", date: "5 hours ago" },
    { id: "PAY-099", fleet: "Kabul Rapid Transit", amount: "80,000 AFN", method: "Bank Transfer", status: "COMPLETED", date: "2 days ago" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary" />
              Fleet Payouts
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Review and approve withdrawal requests from Fleet owners.
            </BodyMd>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
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
                    <tr key={p.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono text-xs">{p.id}</td>
                      <td className="px-6 py-4 font-bold">{p.fleet}</td>
                      <td className="px-6 py-4 font-bold text-gold">{p.amount}</td>
                      <td className="px-6 py-4">{p.method}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.status === 'PENDING' ? 'secondary' : 'default'} className="text-[10px] gap-1">
                          {p.status === 'PENDING' ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'PENDING' && (
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
