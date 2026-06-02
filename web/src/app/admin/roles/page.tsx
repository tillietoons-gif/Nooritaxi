"use client"

import { useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Plus, Edit2, Trash2, Key, Users } from "lucide-react"

export default function RolesAdminPage() {
  const [roles] = useState([
    { id: "1", name: "Super Admin", description: "Full access to everything.", isSystem: true, admins: 2, perms: "All" },
    { id: "2", name: "Operations Admin", description: "Manage trips, drivers, live tracking.", isSystem: true, admins: 5, perms: "8" },
    { id: "3", name: "Finance Admin", description: "Manage wallets and settlements.", isSystem: true, admins: 3, perms: "6" },
    { id: "4", name: "Junior Support", description: "Read-only access to tickets.", isSystem: false, admins: 12, perms: "3" },
  ]);

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Role Management
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage RBAC roles and assign granular permissions.
              </BodyMd>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full">
              <Plus className="h-4 w-4" /> Create Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map(role => (
              <Card key={role.id} className="glass-premium border-primary/10">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-5 w-5 ${role.isSystem ? 'text-gold' : 'text-primary'}`} />
                      <h3 className="font-bold text-lg">{role.name}</h3>
                    </div>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-[10px] border-gold/30 text-gold uppercase tracking-widest bg-gold/5">System</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 h-10">{role.description}</p>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-background/50 px-3 py-1.5 rounded-md">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" /> {role.admins} Admins
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-background/50 px-3 py-1.5 rounded-md">
                      <Key className="h-3.5 w-3.5 text-muted-foreground" /> {role.perms} Permissions
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs border-primary/20 hover:bg-primary/5">
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    {!role.isSystem && (
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 border-red-500/20 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
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
