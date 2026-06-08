"use client"

import { AuthGate } from "@/components/auth-gate"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plane, MapPin, Plus, List } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AirportAdminPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Airport Operations"
            subtitle="Manage airport locations, specialized fleet queues, and transit logistics."
            actions={
              <Button className="font-black uppercase tracking-widest">
                <Plus className="mr-2 h-4 w-4" /> Add Terminal
              </Button>
            }
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" /> Active Terminals
                </CardTitle>
              </CardHeader>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">Kabul International (KBL) is the only active airport node.</p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Pickup Points
                </CardTitle>
              </CardHeader>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">4 designated pickup bays configured for KBL.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
