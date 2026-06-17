"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Plus, Users, Car, ArrowRight, TrendingUp } from "lucide-react"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function FleetsAdminPage() {
  const fleets = [
    { id: "1", name: "Kabul Rapid Transit", owner: "Ahmad Shah", drivers: 145, vehicles: 120, status: "APPROVED", city: "Kabul", revenue: "84,000 AFN" },
    { id: "2", name: "Herat Mobility Solutions", owner: "Zubair Ansari", drivers: 82, vehicles: 75, status: "APPROVED", city: "Herat", revenue: "32,500 AFN" },
    { id: "3", name: "Mazar City Cabs", owner: "Farhad N.", drivers: 0, vehicles: 0, status: "PENDING", city: "Mazar-i-Sharif", revenue: "0 AFN" }
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Fleet Management"
            subtitle="Manage fleet partners, drivers, vehicles, and commission structures."
            actions={
              <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Register Fleet
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4">
            {fleets.map(fleet => (
              <Card key={fleet.id} className="border-primary/10 shadow-xl glass-premium hover:border-primary/30 transition-all group">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-xl tracking-tight">{fleet.name}</h3>
                      <Badge variant={fleet.status === 'APPROVED' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                        {fleet.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5">
                        {fleet.city}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Managed by {fleet.owner}</p>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-black text-primary flex items-center justify-center gap-2">
                        <Users className="h-5 w-5 opacity-40" /> {fleet.drivers}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Drivers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-primary flex items-center justify-center gap-2">
                        <Car className="h-5 w-5 opacity-40" /> {fleet.vehicles}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Vehicles</p>
                    </div>
                    <div className="text-center min-w-[120px]">
                      <p className="text-xl font-black text-gold flex items-center justify-center gap-2">
                        <TrendingUp className="h-5 w-5 opacity-40" /> {fleet.revenue}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">7D Revenue</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button variant="outline" className="font-black uppercase tracking-widest text-[10px] border-primary/20 group-hover:bg-primary group-hover:text-white transition-all" asChild>
                      <Link href={`/admin/fleets/${fleet.id}`}>
                        Manage <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
