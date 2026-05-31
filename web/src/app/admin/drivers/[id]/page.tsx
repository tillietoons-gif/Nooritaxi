"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Car,
  CreditCard,
  ChevronLeft,
  Download
} from "lucide-react"
import Image from "next/image"

interface DriverDoc {
  id: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  url: string
  expiryDate?: string
  updatedAt: string
}

interface DriverDetails {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'pending'
  rating: number
  vehicleType: string
  vehicleModel: string
  plateNumber: string
  documents: DriverDoc[]
}

export default function DriverDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [driver, setDriver] = useState<DriverDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDocs = useCallback(async () => {
    // Mock data for now
    const mockDriver: DriverDetails = {
      id: id as string,
      name: "Ahmad Shah",
      email: "ahmad.shah@example.af",
      phone: "+93 70 123 4567",
      status: 'pending',
      rating: 4.8,
      vehicleType: "Standard",
      vehicleModel: "Toyota Corolla 2018",
      plateNumber: "KBL-12345",
      documents: [
        {
          id: "doc1",
          type: "Driving License",
          status: 'pending',
          url: "https://placehold.co/600x400/png?text=Driving+License",
          updatedAt: "2024-03-20"
        },
        {
          id: "doc2",
          type: "Vehicle Registration",
          status: 'approved',
          url: "https://placehold.co/600x400/png?text=Vehicle+Reg",
          updatedAt: "2024-03-20"
        }
      ]
    }
    setDriver(mockDriver)
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  if (loading) return <div>Loading...</div>
  if (!driver) return <div>Driver not found</div>

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="container mx-auto py-8 px-4 mt-20">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Drivers
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{driver.name}</CardTitle>
                    <p className="text-muted-foreground">{driver.email}</p>
                  </div>
                </div>
                <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                  {driver.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Vehicle:</span>
                      <span className="ml-2">{driver.vehicleModel} ({driver.plateNumber})</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Type:</span>
                      <span className="ml-2">{driver.vehicleType}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm">
                      <AlertCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Rating:</span>
                      <span className="ml-2">{driver.rating} / 5.0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {driver.documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{doc.type}</span>
                      </div>
                      <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}>
                        {doc.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                      <Image
                        src={doc.url}
                        alt={doc.type}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground italic">Last updated: {doc.updatedAt}</p>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                        {doc.status === 'pending' && (
                          <>
                            <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700">
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">Activate Driver Account</Button>
                <Button variant="outline" className="w-full">Message Driver</Button>
                <Separator />
                <Button variant="destructive" className="w-full">Suspend Account</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Applied on March 15, 2024</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Vehicle background check passed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
