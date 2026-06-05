"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Plus } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function SubscriptionsPage() {
  const plans = [
    { id: "SUB-DRV-PRO", name: "Driver Pro", type: "DRIVER", price: "500 AFN", cycle: "MONTHLY", active: "1,240", status: "ACTIVE" },
    { id: "SUB-MRCH-GLD", name: "Merchant Gold", type: "MERCHANT", price: "2,000 AFN", cycle: "MONTHLY", active: "342", status: "ACTIVE" },
    { id: "SUB-VIP-RIDER", name: "Noori VIP", type: "USER_VIP", price: "1,000 AFN", cycle: "QUARTERLY", active: "8,901", status: "ACTIVE" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Subscription Plans"
            subtitle="Manage premium memberships for Drivers, Merchants, and VIP Users."
            actions={
              <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Create Plan
              </Button>
            }
          />

          <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Plan Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Active</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map(p => (
                      <tr key={p.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-bold tracking-tight">{p.name}</td>
                        <td className="px-6 py-4"><Badge variant="outline" className="text-[9px] uppercase font-black border-primary/20">{p.type}</Badge></td>
                        <td className="px-6 py-4 font-black text-gold text-sm">{p.price}</td>
                        <td className="px-6 py-4 font-mono text-xs">{p.active}</td>
                        <td className="px-6 py-4">
                          <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" className="font-bold text-[10px] uppercase border-primary/20 hover:bg-primary hover:text-white transition-all">
                            Manage
                          </Button>
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
