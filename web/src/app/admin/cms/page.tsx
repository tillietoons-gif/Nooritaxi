"use client"

import { AuthGate } from "@/components/auth-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function CMSAdminPage() {
  const pages = [
    { id: "CMS-001", title: "Terms of Service", slug: "/terms", type: "LEGAL", updated: "2 days ago", status: "PUBLISHED" },
    { id: "CMS-002", title: "Privacy Policy", slug: "/privacy", type: "PRIVACY", updated: "1 week ago", status: "PUBLISHED" },
    { id: "CMS-003", title: "How to become a Driver", slug: "/help/driver-onboarding", type: "HELP_ARTICLE", updated: "2 hours ago", status: "DRAFT" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminPageHeader
            title="Content Management"
            subtitle="Manage legal pages, help articles, and platform documentation."
            actions={
              <Button className="font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Create Page
              </Button>
            }
          />

          <Card className="border-primary/10 shadow-xl glass-premium overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-primary/10 bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map(p => (
                      <tr key={p.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-bold tracking-tight">{p.title}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-primary">{p.slug}</td>
                        <td className="px-6 py-4"><Badge variant="outline" className="text-[9px] uppercase font-black border-primary/20">{p.type}</Badge></td>
                        <td className="px-6 py-4">
                          <Badge variant={p.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" className="font-bold text-[10px] uppercase border-primary/20 hover:bg-primary hover:text-white transition-all">
                            Edit Content
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGate>
  )
}
