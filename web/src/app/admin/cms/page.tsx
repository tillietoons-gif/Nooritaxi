"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

export default function CMSPage() {
  const pages = [
    { id: "CMS-001", title: "Terms and Conditions", slug: "/terms", type: "TERMS", updated: "2 days ago", status: "PUBLISHED" },
    { id: "CMS-002", title: "Privacy Policy", slug: "/privacy", type: "PRIVACY", updated: "1 week ago", status: "PUBLISHED" },
    { id: "CMS-003", title: "How to become a Driver", slug: "/help/driver-onboarding", type: "HELP_ARTICLE", updated: "2 hours ago", status: "DRAFT" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Content Management System (CMS)
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Manage Legal Pages, Help Articles, and App Landing Page content.
              </BodyMd>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold rounded-full">
              <Plus className="h-4 w-4" /> Create Page
            </Button>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-bold">{p.title}</td>
                      <td className="px-6 py-4 font-mono text-xs text-primary">{p.slug}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{p.type}</Badge></td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{p.updated}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="h-8">
                          Edit Content
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
