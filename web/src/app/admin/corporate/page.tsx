"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function CorporateAdminPage() {
  const accounts = [
    { id: "CORP-001", name: "Etisalat Afghanistan", employees: 450, status: "ACTIVE", creditLimit: "500,000 AFN" },
    { id: "CORP-002", name: "Azizi Bank", employees: 120, status: "ACTIVE", creditLimit: "200,000 AFN" },
    { id: "CORP-003", name: "Roshan Telecom", employees: 85, status: "PENDING", creditLimit: "0 AFN" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Corporate Accounts"
            subtitle="Manage enterprise partnerships, billing limits, and employee access."
            actions={
              <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Add Partner
              </Button>
            }
          />

          <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Organization</th>
                      <th className="px-6 py-4">Employees</th>
                      <th className="px-6 py-4">Credit Limit</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(a => (
                      <tr key={a.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-black text-lg tracking-tight uppercase">{a.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{a.id}</div>
                        </td>
                        <td className="px-6 py-4 font-bold">{a.employees}</td>
                        <td className="px-6 py-4 font-black text-gold">{a.creditLimit}</td>
                        <td className="px-6 py-4">
                          <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" className="font-bold text-[10px] uppercase border-primary/20 hover:bg-primary hover:text-white transition-all">
                            Manage Account <ArrowRight className="ml-2 h-4 w-4" />
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
