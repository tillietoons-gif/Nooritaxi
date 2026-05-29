"use client"

import { useEffect, useState } from "react"
import { authedFetch } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeadingMd, BodyMd } from "@/components/ui/typography"
import { Check, X, ExternalLink } from "lucide-react"

type Document = {
  id: string;
  driverId: string;
  type: string;
  url: string;
  status: string;
  createdAt: string;
  driver: {
    user: {
      name: string;
      phone: string;
    }
  }
}

export default function KycVerificationPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDocuments = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await authedFetch("/users/admin/documents/pending?page=1&limit=50")
      if (!response.ok) throw new Error("Failed to fetch pending documents")
      const data = await response.json()
      setDocuments(data.items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleVerify = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      const response = await authedFetch(`/users/admin/documents/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })
      if (!response.ok) throw new Error(`Failed to ${status.toLowerCase()} document`)
      await loadDocuments()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div>
        <HeadingMd className="text-2xl">Driver Verification (KYC)</HeadingMd>
        <BodyMd className="text-muted-foreground">Review and approve pending driver documents to activate their accounts.</BodyMd>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive mb-4">{error}</p>}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No pending documents to review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Driver</th>
                    <th className="px-4 py-3">Document Type</th>
                    <th className="px-4 py-3">Submitted At</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="px-4 py-4 font-medium">
                        {doc.driver?.user?.name || "Unknown"}
                        <div className="text-xs text-muted-foreground">{doc.driver?.user?.phone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline">{doc.type.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleVerify(doc.id, "REJECTED")}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => handleVerify(doc.id, "VERIFIED")}>
                            <Check className="h-4 w-4 mr-1" /> Verify
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
