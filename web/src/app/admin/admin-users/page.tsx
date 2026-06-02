"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plus, Shield, MapPin, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AdminUsersPage() {
  const users = [
    { id: 1, name: "Ali Khan", email: "ali@nooritaxi.af", roles: ["Super Admin"], city: null, status: "Active" },
    { id: 2, name: "Zahra Ahmadi", email: "zahra@nooritaxi.af", roles: ["Operations Admin", "City Admin"], city: "Kabul", status: "Active" },
    { id: 3, name: "Karim Rasouli", email: "karim@nooritaxi.af", roles: ["Support Admin"], city: null, status: "Active" },
    { id: 4, name: "Farid Javed", email: "farid@nooritaxi.af", roles: ["City Admin"], city: "Herat", status: "Inactive" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Admin Directory
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage internal admin accounts, role assignments, and city scopes.
              </BodyMd>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full">
              <Plus className="h-4 w-4" /> Add Admin
            </Button>
          </div>

          <Card className="glass-premium border-primary/10">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-primary/10">
                    <tr>
                      <th className="px-6 py-4 font-black">Admin</th>
                      <th className="px-6 py-4 font-black">Roles</th>
                      <th className="px-6 py-4 font-black">City Scope</th>
                      <th className="px-6 py-4 font-black">Status</th>
                      <th className="px-6 py-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-primary/5 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {u.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map(r => (
                              <Badge key={r} variant="outline" className={`text-[10px] uppercase tracking-wider ${r === 'Super Admin' ? 'border-gold text-gold bg-gold/5' : 'border-primary/30 text-primary bg-primary/5'}`}>
                                <Shield className="h-3 w-3 mr-1" /> {r}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.city ? (
                            <Badge variant="secondary" className="text-[10px] uppercase bg-muted text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" /> {u.city}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Global</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={u.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  )
}
