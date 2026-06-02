"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, HeadingSm, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Car, Map, Banknote, ShieldAlert } from "lucide-react"

export default function FleetDetailPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <HeadingLg className="mb-2">Kabul Rapid Transit</HeadingLg>
              <div className="flex gap-2">
                <Badge>APPROVED</Badge>
                <Badge variant="outline">Kabul</Badge>
                <Badge variant="outline" className="border-gold text-gold">Commission: 12%</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">Suspend Fleet</Button>
              <Button>Edit Commission</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass-premium">
              <CardContent className="p-6">
                <Users className="h-6 w-6 text-primary mb-2" />
                <h3 className="text-3xl font-black">145</h3>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
              </CardContent>
            </Card>
            <Card className="glass-premium">
              <CardContent className="p-6">
                <Car className="h-6 w-6 text-primary mb-2" />
                <h3 className="text-3xl font-black">120</h3>
                <p className="text-sm text-muted-foreground">Active Vehicles</p>
              </CardContent>
            </Card>
            <Card className="glass-premium">
              <CardContent className="p-6">
                <Map className="h-6 w-6 text-primary mb-2" />
                <h3 className="text-3xl font-black">8,432</h3>
                <p className="text-sm text-muted-foreground">Monthly Trips</p>
              </CardContent>
            </Card>
            <Card className="glass-premium">
              <CardContent className="p-6">
                <Banknote className="h-6 w-6 text-gold mb-2" />
                <h3 className="text-3xl font-black text-gold">450K AFN</h3>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><HeadingSm>Recent Drivers</HeadingSm></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-bold">Driver #{8000 + i}</p>
                        <p className="text-xs text-muted-foreground">Assigned 2 days ago</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">View All Drivers</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><HeadingSm>Fleet Managers</HeadingSm></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-bold">Ahmad Shah</p>
                      <p className="text-xs text-muted-foreground">Owner</p>
                    </div>
                    <ShieldAlert className="h-4 w-4 text-gold" />
                  </div>
                  <Button variant="outline" className="w-full">Add Manager</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
