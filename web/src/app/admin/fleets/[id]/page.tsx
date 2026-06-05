"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Car, Map, Banknote, ShieldAlert } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function FleetDetailPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Kabul Rapid Transit"
            subtitle={
              <div className="flex items-center gap-2 mt-2">
                <Badge className="text-[9px] font-black uppercase">APPROVED</Badge>
                <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20">Kabul</Badge>
                <Badge variant="outline" className="text-[9px] font-black uppercase border-gold/40 text-gold bg-gold/5">Commission: 12%</Badge>
              </div>
            }
            actions={
              <div className="flex gap-2">
                <Button variant="outline" className="font-bold text-[10px] uppercase border-destructive/20 text-destructive hover:bg-destructive/10">Suspend Fleet</Button>
                <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">Edit Commission</Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="p-6">
                <Users className="h-6 w-6 text-primary/40 mb-3" />
                <h3 className="text-3xl font-black leading-none">145</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Total Drivers</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="p-6">
                <Car className="h-6 w-6 text-primary/40 mb-3" />
                <h3 className="text-3xl font-black leading-none">120</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Active Vehicles</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="p-6">
                <Map className="h-6 w-6 text-primary/40 mb-3" />
                <h3 className="text-3xl font-black leading-none">8,432</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Monthly Trips</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-xl glass-premium">
              <CardContent className="p-6">
                <Banknote className="h-6 w-6 text-gold/40 mb-3" />
                <h3 className="text-3xl font-black text-gold leading-none">450K</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Monthly AFN</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/10 shadow-2xl glass-premium overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest">Recent Drivers</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-primary/5 bg-background/50 hover:bg-primary/5 transition-colors">
                    <div>
                      <p className="font-bold text-sm">Driver #{8000 + i}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Assigned 2 days ago</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20">Active</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full font-bold text-[10px] uppercase border-primary/20 hover:bg-primary hover:text-white transition-all">View All Drivers</Button>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-2xl glass-premium overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest">Fleet Managers</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl border border-primary/5 bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold"><ShieldAlert className="h-4 w-4" /></div>
                    <div>
                      <p className="font-bold text-sm">Ahmad Shah</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Owner & Key Contact</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full font-bold text-[10px] uppercase border-primary/20 hover:bg-primary hover:text-white transition-all">Add Manager</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
