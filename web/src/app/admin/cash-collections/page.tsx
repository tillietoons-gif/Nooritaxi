"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HandCoins, Check, Plus } from "lucide-react"

export default function CashCollectionsPage() {
  const settlements = [
    { id: "SET-201", user: "Ali Driver", role: "Driver", netBalance: "-4,500 AFN", status: "PENDING" },
    { id: "SET-202", user: "Mazar Eats", role: "Merchant", netBalance: "-12,000 AFN", status: "OVERDUE" },
    { id: "SET-203", user: "Kabul Rapid", role: "Fleet", netBalance: "-24,000 AFN", status: "PARTIAL" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <HandCoins className="h-8 w-8 text-primary" />
                Cash Collections
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage physical cash collected from drivers and merchants to settle their negative balances.
              </BodyMd>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full">
              <Plus className="h-4 w-4" /> Record Collection
            </Button>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Settlement ID</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount Owed</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map(s => (
                    <tr key={s.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono text-xs">{s.id}</td>
                      <td className="px-6 py-4 font-bold">{s.user}</td>
                      <td className="px-6 py-4">{s.role}</td>
                      <td className="px-6 py-4 font-bold text-red-500">{s.netBalance}</td>
                      <td className="px-6 py-4">
                        <Badge variant={s.status === 'OVERDUE' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="h-8 border-primary/50 text-primary hover:bg-primary/10">
                          <Check className="h-4 w-4 mr-1" /> Mark Collected
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
