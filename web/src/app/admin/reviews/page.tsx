"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Check, X, ShieldAlert } from "lucide-react"

export default function ReviewsPage() {
  const reviews = [
    { id: "REV-901", author: "Ahmad Jan", target: "Driver (Ali)", rating: 5, comment: "Very fast and polite!", status: "VISIBLE" },
    { id: "REV-902", author: "Zahra S.", target: "Restaurant (Kabul Grill)", rating: 1, comment: "Terrible food, cold.", status: "REPORTED" },
    { id: "REV-903", author: "Karim M.", target: "Trip (TRP-100)", rating: 2, comment: "Driver asked for extra cash.", status: "PENDING_REVIEW" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <HeadingLg className="mb-2 flex items-center gap-2">
                <Star className="h-8 w-8 text-primary" />
                Ratings & Reviews Moderation
              </HeadingLg>
              <BodyMd className="text-muted-foreground">
                Moderate user feedback for Drivers, Merchants, and Trips.
              </BodyMd>
            </div>
            <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
              <ShieldAlert className="h-4 w-4 mr-1" /> View Reported
            </Button>
          </div>

          <Card className="glass-premium">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Author</th>
                    <th className="px-6 py-4">Target Entity</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Comment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono text-xs">{r.id}</td>
                      <td className="px-6 py-4 font-bold">{r.author}</td>
                      <td className="px-6 py-4">{r.target}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gold font-bold">
                          <Star className="h-4 w-4 fill-current mr-1" /> {r.rating}.0
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground italic text-xs max-w-[200px] truncate">"{r.comment}"</td>
                      <td className="px-6 py-4">
                        <Badge variant={r.status === 'REPORTED' || r.status === 'PENDING_REVIEW' ? 'destructive' : 'default'} className="text-[10px]">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(r.status === 'REPORTED' || r.status === 'PENDING_REVIEW') ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white"><Check className="h-4 w-4 mr-1" /> Approve</Button>
                            <Button size="sm" variant="outline" className="h-8 text-red-500 hover:bg-red-500/10"><X className="h-4 w-4 mr-1" /> Hide</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8">Hide</Button>
                        )}
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
