"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Plus } from "lucide-react"

export default function SubscriptionsPage() {
  const plans = [
    { id: "SUB-DRV-PRO", name: "Driver Pro", type: "DRIVER", price: "500 AFN", cycle: "MONTHLY", active: "1,240", status: "ACTIVE" },
    { id: "SUB-MRCH-GLD", name: "Merchant Gold", type: "MERCHANT", price: "2,000 AFN", cycle: "MONTHLY", active: "342", status: "ACTIVE" },
    { id: "SUB-VIP-RIDER", name: "Noori VIP", type: "USER_VIP", price: "1,000 AFN", cycle: "QUARTERLY", active: "8,901", status: "ACTIVE" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Crown className="h-8 w-8 text-primary" />
                Subscription Plans
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage premium memberships for Drivers, Merchants, and VIP Users.
              </BodyMd>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full">
              <Plus className="h-4 w-4" /> Create Plan
            </Button>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Billing Cycle</th>
                    <th className="px-6 py-4">Active Subs</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-bold text-primary">{p.name}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{p.type}</Badge></td>
                      <td className="px-6 py-4 font-black text-gold">{p.price}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{p.cycle}</td>
                      <td className="px-6 py-4 font-mono">{p.active}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="h-8">
                          Manage
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
