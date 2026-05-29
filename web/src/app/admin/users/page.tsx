"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeadingMd, BodyMd } from "@/components/ui/typography"

export default function AdminUsersPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div>
        <HeadingMd className="text-2xl">User Management</HeadingMd>
        <BodyMd className="text-muted-foreground">Manage riders, drivers, and merchant accounts.</BodyMd>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">User management interface is under construction.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
