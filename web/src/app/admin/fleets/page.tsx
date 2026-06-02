"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Plus, Users, Car, ArrowRight, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function FleetsAdminPage() {
  const fleets = [
    { id: "1", name: "Kabul Rapid Transit", owner: "Ahmad Shah", drivers: 145, vehicles: 120, status: "APPROVED", city: "Kabul", revenue: "84,000 AFN" },
    { id: "2", name: "Herat Mobility Solutions", owner: "Zubair Ansari", drivers: 82, vehicles: 75, status: "APPROVED", city: "Herat", revenue: "32,500 AFN" },
    { id: "3", name: "Mazar City Cabs", owner: "Farhad N.", drivers: 0, vehicles: 0, status: "PENDING", city: "Mazar-i-Sharif", revenue: "0 AFN" }
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                Fleet Management
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage fleet partners, drivers, vehicles, and commission structures.
              </BodyMd>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full">
              <Plus className="h-4 w-4" /> Register Fleet
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {fleets.map(fleet => (
              <Card key={fleet.id} className="glass-premium border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl">{fleet.name}</h3>
                      <Badge variant={fleet.status === 'APPROVED' ? 'default' : 'secondary'} className="text-[10px]">
                        {fleet.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted">
                        {fleet.city}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Owner: {fleet.owner}</p>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-black text-primary flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" /> {fleet.drivers}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Drivers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-primary flex items-center justify-center gap-1">
                        <Car className="h-4 w-4" /> {fleet.vehicles}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vehicles</p>
                    </div>
                    <div className="text-center min-w-[100px]">
                      <p className="text-xl font-black text-gold flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4" /> {fleet.revenue}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Week Rev.</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button variant="outline" className="gap-2 w-full md:w-auto" asChild>
                      <Link href={`/admin/fleets/${fleet.id}`}>
                        Manage Fleet <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
