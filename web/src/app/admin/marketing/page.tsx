"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tag, Plus } from "lucide-react"

export default function PromosPage() {
  const promos = [
    { id: "PRM-KABUL20", code: "KABUL20", type: "PERCENTAGE", value: "20%", limit: "1,000", status: "ACTIVE" },
    { id: "PRM-FREEDEL", code: "FREEDEL", type: "FREE_DELIVERY", value: "100%", limit: "500", status: "ACTIVE" },
    { id: "PRM-NEWUSER", code: "NEWUSER", type: "FIXED_AMOUNT", value: "50 AFN", limit: "Unlimited", status: "INACTIVE" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Tag className="h-8 w-8 text-primary" />
                Promotions & Marketing
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage discount codes, rider campaigns, and loyalty rewards.
              </BodyMd>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full">
              <Plus className="h-4 w-4" /> Create Promo
            </Button>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Promo Code</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">Usage Limit</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-black text-lg tracking-wider text-primary">{p.code}</td>
                      <td className="px-6 py-4 font-bold">{p.type}</td>
                      <td className="px-6 py-4 text-gold font-bold">{p.value}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.limit}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="h-8">
                          Edit
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
