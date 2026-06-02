"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { KeySquare, Check, X } from "lucide-react"

export default function PermissionsMatrixPage() {
  const modules = [
    { name: "Dashboard", actions: ["view"] },
    { name: "Users", actions: ["view", "create", "edit", "delete"] },
    { name: "Drivers", actions: ["view", "create", "edit", "suspend", "verify"] },
    { name: "Trips", actions: ["view", "cancel", "assign"] },
    { name: "Wallets", actions: ["view", "adjust"] },
    { name: "Finance", actions: ["view", "export"] },
    { name: "Support", actions: ["view", "reply"] },
    { name: "Roles", actions: ["view", "create", "edit", "delete"] },
  ]

  const roles = ["Super Admin", "Operations", "Support", "Finance"]

  const hasPermission = (role: string, mod: string, action: string) => {
    if (role === "Super Admin") return true;
    if (role === "Operations" && ["Dashboard", "Drivers", "Trips"].includes(mod)) return true;
    if (role === "Support" && ["Dashboard", "Support", "Users"].includes(mod)) return true;
    if (role === "Finance" && ["Dashboard", "Wallets", "Finance"].includes(mod)) return true;
    return false;
  }

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <KeySquare className="h-8 w-8 text-primary" />
              Permission Matrix
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Overview of all granular permissions across system roles.
            </BodyMd>
          </div>

          <Card className="glass-premium border-primary/10 overflow-hidden overflow-x-auto">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-4 font-black">Module</th>
                    <th className="px-6 py-4 font-black">Action</th>
                    {roles.map(r => (
                      <th key={r} className="px-6 py-4 font-black text-center">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.flatMap((mod, mIdx) => 
                    mod.actions.map((act, aIdx) => (
                      <tr key={`${mod.name}-${act}`} className="border-b border-primary/5 hover:bg-muted/30">
                        {aIdx === 0 ? (
                          <td className="px-6 py-4 font-bold text-primary align-top" rowSpan={mod.actions.length}>
                            {mod.name}
                          </td>
                        ) : null}
                        <td className="px-6 py-4 font-medium">
                          {act}
                        </td>
                        {roles.map(r => (
                          <td key={r} className="px-6 py-4 text-center">
                            {hasPermission(r, mod.name, act) ? (
                              <Check className="h-4 w-4 text-primary mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  )
}
