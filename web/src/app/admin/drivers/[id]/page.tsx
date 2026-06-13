"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Phone, Mail, Car } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function DriverDetailPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Ahmad Mansoor"
            subtitle={
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gold/10 text-gold rounded border border-gold/20 text-[10px] font-black uppercase">
                  <Star className="h-3 w-3 fill-current" /> 4.9 Rating
                </div>
                <Badge className="text-[9px] font-black uppercase">PLATINUM TIER</Badge>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Joined Jan 2024</span>
              </div>
            }
            actions={
              <div className="flex gap-2">
                <Button variant="outline" className="font-bold text-[10px] uppercase border-destructive/20 text-destructive hover:bg-destructive/10">Suspend Account</Button>
                <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">Verify Documents</Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg"><Phone className="h-4 w-4 text-muted-foreground" /></div>
                    <p className="text-sm font-bold">+93 700 123 456</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                    <p className="text-sm font-bold">a.mansoor@noori.af</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
                    <p className="text-sm font-bold">Kabul, District 10</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="p-4 rounded-xl border border-primary/5 bg-background/50 text-center">
                    <Car className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                    <p className="font-black text-lg tracking-tight">KBL-8291</p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Toyota Corolla (2018)</p>
                    <Badge variant="outline" className="mt-3 text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">Active in Fleet</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="bg-primary/5 p-1 border border-primary/10">
                  <TabsTrigger value="activity" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Live Activity</TabsTrigger>
                  <TabsTrigger value="payouts" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Financials</TabsTrigger>
                  <TabsTrigger value="compliance" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-primary/5 bg-background/50 shadow-lg">
                      <CardContent className="p-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Trips</h4>
                        <p className="text-3xl font-black">1,402</p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/5 bg-background/50 shadow-lg">
                      <CardContent className="p-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Lifetime Earned</h4>
                        <p className="text-3xl font-black text-emerald-600">284K AFN</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-xs font-black uppercase tracking-widest">Recent Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="px-6 py-12 text-center text-muted-foreground italic text-sm">Trip history graph processing...</div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </AuthGate>
  )
}
