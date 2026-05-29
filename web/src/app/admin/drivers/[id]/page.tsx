"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AuthGate } from "@/components/auth-gate"
import { authedFetch } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/admin/admin-list-page"

type DriverDoc = {
  id: string
  type: string
  url: string
  status: string
  createdAt: string
  verifiedAt?: string | null
}

export default function DriverDetailsPage() {
  const { id } = useParams() as { id: string }
  const [docs, setDocs] = useState<DriverDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDocs() {
    try {
      const res = await authedFetch(`/admin/drivers/${id}/documents`)
      if (!res.ok) throw new Error("Failed to load documents")
      const data = await res.json()
      setDocs(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [id])

  async function updateDocStatus(docId: string, status: string) {
    if (!confirm(`Mark document as ${status}?`)) return
    try {
      const res = await authedFetch(`/admin/drivers/${id}/documents/${docId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error("Failed to update status")
      await loadDocs()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Driver Verification</h1>
              <p className="text-sm text-muted-foreground">Driver ID: {id}</p>
            </div>
            <Link href="/admin/drivers" className="text-sm text-primary hover:underline">
              ← Back to Drivers
            </Link>
          </div>

          {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
          
          <Card>
            <CardHeader>
              <CardTitle>KYC Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading documents...</p>
              ) : docs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents uploaded.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="border rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{doc.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                      
                      <div className="aspect-video bg-muted/20 border border-muted/20 rounded-lg overflow-hidden flex items-center justify-center relative">
                        {/* Mock document preview image */}
                        <img src={doc.url} alt={doc.type} className="object-cover w-full h-full opacity-60" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
                        <span className="hidden absolute text-xs text-muted-foreground break-all px-2">{doc.url}</span>
                      </div>

                      {doc.status === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <Button className="flex-1" size="sm" variant="default" onClick={() => updateDocStatus(doc.id, "VERIFIED")}>Approve</Button>
                          <Button className="flex-1" size="sm" variant="destructive" onClick={() => updateDocStatus(doc.id, "REJECTED")}>Reject</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGate>
  )
}
