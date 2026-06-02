"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, FileText, Plus, ShieldCheck } from "lucide-react"

export default function VehiclesPage() {
  const vehicles = [
    { plate: "KBL-12345", type: "CAR", make: "Toyota", model: "Corolla", status: "ACTIVE", driver: "Ahmad" },
    { plate: "HRT-98765", type: "MOTORBIKE", make: "Honda", model: "CG125", status: "MAINTENANCE", driver: "Ali" },
    { plate: "MZR-45678", type: "SUV", make: "Toyota", model: "Highlander", status: "ACTIVE", driver: "Zahra" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Car className="h-8 w-8 text-primary" />
                Vehicle Management
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage vehicle registry, categories, and inspection status.
              </BodyMd>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                <ShieldCheck className="h-4 w-4 mr-1" /> View Inspections
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full">
                <Plus className="h-4 w-4 mr-1" /> Add Vehicle
              </Button>
            </div>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Plate Number</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Make & Model</th>
                    <th className="px-6 py-4">Assigned Driver</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.plate} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono font-black text-primary">{v.plate}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{v.type}</Badge></td>
                      <td className="px-6 py-4 font-bold">{v.make} {v.model}</td>
                      <td className="px-6 py-4 text-muted-foreground">{v.driver}</td>
                      <td className="px-6 py-4">
                        <Badge variant={v.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                          {v.status}
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
