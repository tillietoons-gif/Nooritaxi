"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tag, Plus } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function PromosPage() {
  const promos = [
    { id: "PRM-KABUL20", code: "KABUL20", type: "PERCENTAGE", value: "20%", limit: "1,000", status: "ACTIVE" },
    { id: "PRM-FREEDEL", code: "FREEDEL", type: "FREE_DELIVERY", value: "100%", limit: "500", status: "ACTIVE" },
    { id: "PRM-NEWUSER", code: "NEWUSER", type: "FIXED_AMOUNT", value: "50 AFN", limit: "Unlimited", status: "INACTIVE" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Promos & Marketing"
            subtitle="Manage discount codes, rider campaigns, and loyalty rewards."
            actions={
              <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Create Promo
              </Button>
            }
          />

          <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Promo Code</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Limit</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map(p => (
                      <tr key={p.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-black text-lg tracking-wider text-primary leading-none">{p.code}</td>
                        <td className="px-6 py-4 font-bold text-xs">{p.type}</td>
                        <td className="px-6 py-4 text-gold font-black text-sm">{p.value}</td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground">{p.limit}</td>
                        <td className="px-6 py-4">
                          <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" className="font-bold text-[10px] uppercase border-primary/20 hover:bg-primary hover:text-white transition-all">
                            Edit
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
